const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../db');

// Create payment intent for subscription
const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planId, paymentMethodId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Get plan details
    const planQuery = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
    if (planQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = planQuery.rows[0];
    const amount = Math.round(parseFloat(plan.price) * 100); // Convert to cents

    // Get user details
    const userQuery = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [userId]);
    const user = userQuery.rows[0];

    // Create or get Stripe customer
    let customer;
    const customerQuery = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
    
    if (customerQuery.rows[0]?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(customerQuery.rows[0].stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          userId: userId.toString()
        }
      });

      // Save customer ID to database
      await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customer.id, userId]);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'lkr', // Sri Lankan Rupees
      customer: customer.id,
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        userId: userId.toString(),
        planId: planId.toString(),
        planName: plan.name
      },
      description: `FinGuard ${plan.name} Subscription - ${plan.duration}`
    });

    // Handle payment result
    if (paymentIntent.status === 'succeeded') {
      // Payment successful - activate subscription
      await activateSubscription(userId, planId, paymentIntent.id);
      
      res.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount
        }
      });
    } else if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
      // 3D Secure authentication required
      res.json({
        requiresAction: true,
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret
        }
      });
    } else {
      res.status(400).json({ error: 'Payment failed', status: paymentIntent.status });
    }

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Payment processing failed', details: error.message });
  }
};

// Confirm payment after 3D Secure
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.userId;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Activate subscription
      const planId = paymentIntent.metadata.planId;
      await activateSubscription(userId, planId, paymentIntentId);
      
      res.json({ success: true, paymentIntent });
    } else {
      res.status(400).json({ error: 'Payment not completed', status: paymentIntent.status });
    }

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
};

// Activate subscription after successful payment
const activateSubscription = async (userId, planId, paymentIntentId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get plan details
    const planQuery = await client.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
    const plan = planQuery.rows[0];

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    switch (plan.duration) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'lifetime':
        endDate.setFullYear(endDate.getFullYear() + 100); // Set far future date
        break;
    }

    // Update or create subscription
    await client.query(`
      INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date, payment_method)
      VALUES ($1, $2, 'active', $3, $4, 'stripe')
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        plan_id = $2, 
        status = 'active', 
        start_date = $3, 
        end_date = $4, 
        updated_at = NOW()
    `, [userId, planId, startDate, endDate]);

    // Record payment transaction
    await client.query(`
      INSERT INTO payment_transactions (
        user_id, plan_id, amount, currency, payment_intent_id, 
        status, payment_method, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [userId, planId, plan.price, 'LKR', paymentIntentId, 'completed', 'stripe']);

    // Update user premium status
    await client.query('UPDATE users SET is_premium = true WHERE id = $1', [userId]);

    // Log the subscription activation
    await client.query(`
      INSERT INTO logs (user_id, activity, details)
      VALUES ($1, $2, $3)
    `, [userId, 'Subscription activated', JSON.stringify({
      planId,
      planName: plan.name,
      duration: plan.duration,
      amount: plan.price,
      paymentIntentId
    })]);

    await client.query('COMMIT');
    console.log(`✅ Subscription activated for user ${userId}, plan: ${plan.name}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error activating subscription:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get payment history
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT 
        pt.*,
        sp.name as plan_name,
        sp.duration
      FROM payment_transactions pt
      JOIN subscription_plans sp ON pt.plan_id = sp.id
      WHERE pt.user_id = $1
      ORDER BY pt.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// Handle Stripe webhooks
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('💳 Payment succeeded:', paymentIntent.id);
        
        // Additional processing if needed
        if (paymentIntent.metadata.userId && paymentIntent.metadata.planId) {
          await activateSubscription(
            parseInt(paymentIntent.metadata.userId),
            parseInt(paymentIntent.metadata.planId),
            paymentIntent.id
          );
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('❌ Payment failed:', failedPayment.id);
        
        // Log failed payment
        if (failedPayment.metadata.userId) {
          await pool.query(`
            INSERT INTO logs (user_id, activity, details)
            VALUES ($1, $2, $3)
          `, [
            parseInt(failedPayment.metadata.userId),
            'Payment failed',
            JSON.stringify({
              paymentIntentId: failedPayment.id,
              amount: failedPayment.amount,
              currency: failedPayment.currency,
              error: failedPayment.last_payment_error
            })
          ]);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
};

// Create setup intent for saving payment methods
const createSetupIntent = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get or create Stripe customer
    let customer;
    const userQuery = await pool.query('SELECT stripe_customer_id, email, full_name FROM users WHERE id = $1', [userId]);
    const user = userQuery.rows[0];
    
    if (user.stripe_customer_id) {
      customer = await stripe.customers.retrieve(user.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { userId: userId.toString() }
      });
      
      await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customer.id, userId]);
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card']
    });

    res.json({
      client_secret: setupIntent.client_secret
    });

  } catch (error) {
    console.error('Setup intent creation error:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  handleWebhook,
  createSetupIntent
};