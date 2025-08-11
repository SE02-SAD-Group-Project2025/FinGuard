// Auto-categorization and Recurring Transaction Detection Service
class AutoCategorizationService {
  constructor() {
    this.isInitialized = false;
    this.categoryRules = new Map();
    this.merchantPatterns = new Map();
    this.recurringTransactions = new Map();
    this.eventListeners = new Map();
    
    // AI-powered categorization patterns
    this.categoryPatterns = {
      // Food & Dining
      food: [
        'restaurant', 'pizza', 'mcdonalds', 'kfc', 'burger', 'starbucks', 'dunkin',
        'cafe', 'diner', 'bistro', 'grill', 'bar', 'pub', 'food', 'dining',
        'grocery', 'supermarket', 'walmart', 'target', 'safeway', 'kroger',
        'whole foods', 'trader joe', 'costco', 'sams club', 'publix'
      ],
      
      // Transportation
      transportation: [
        'gas', 'fuel', 'shell', 'exxon', 'bp', 'chevron', 'mobil', 'sunoco',
        'uber', 'lyft', 'taxi', 'metro', 'bus', 'train', 'parking',
        'car wash', 'auto', 'repair', 'mechanic', 'oil change', 'tire'
      ],
      
      // Shopping
      shopping: [
        'amazon', 'ebay', 'walmart', 'target', 'best buy', 'home depot',
        'lowes', 'macys', 'nordstrom', 'kohls', 'tj maxx', 'marshall',
        'store', 'shop', 'retail', 'mall', 'outlet'
      ],
      
      // Entertainment
      entertainment: [
        'netflix', 'spotify', 'apple music', 'disney', 'hulu', 'amazon prime',
        'youtube', 'movie', 'theater', 'cinema', 'concert', 'game',
        'steam', 'playstation', 'xbox', 'nintendo', 'twitch'
      ],
      
      // Bills & Utilities
      bills: [
        'electric', 'electricity', 'power', 'water', 'gas utility', 'internet',
        'phone', 'mobile', 'verizon', 'att', 'tmobile', 'sprint',
        'comcast', 'xfinity', 'spectrum', 'cox', 'directv', 'dish'
      ],
      
      // Healthcare
      healthcare: [
        'doctor', 'hospital', 'clinic', 'pharmacy', 'cvs', 'walgreens',
        'rite aid', 'medical', 'dental', 'vision', 'insurance'
      ],
      
      // Financial Services
      finance: [
        'bank', 'credit', 'loan', 'mortgage', 'interest', 'fee',
        'chase', 'wells fargo', 'bank of america', 'citibank'
      ]
    };
    
    // Recurring transaction detection settings
    this.recurringSettings = {
      minOccurrences: 3,        // Minimum occurrences to consider recurring
      maxDayVariation: 5,       // Maximum day variation for monthly recurring
      maxAmountVariation: 0.1,  // 10% amount variation tolerance
      lookbackPeriod: 6         // Look back 6 months for patterns
    };
    
    // Load saved data
    this.loadSavedData();
  }

  // Initialize the service
  initialize() {
    if (this.isInitialized) return;
    
    console.log('🤖 Initializing Auto-categorization Service...');
    
    // Start background processing
    this.startBackgroundProcessing();
    
    this.isInitialized = true;
    console.log('✅ Auto-categorization Service initialized');
  }

  // Load saved categorization data
  loadSavedData() {
    try {
      // Load category rules
      const rules = localStorage.getItem('finguard-category-rules');
      if (rules) {
        const parsedRules = JSON.parse(rules);
        this.categoryRules = new Map(parsedRules);
      }
      
      // Load merchant patterns
      const patterns = localStorage.getItem('finguard-merchant-patterns');
      if (patterns) {
        const parsedPatterns = JSON.parse(patterns);
        this.merchantPatterns = new Map(parsedPatterns);
      }
      
      // Load recurring transactions
      const recurring = localStorage.getItem('finguard-recurring-transactions');
      if (recurring) {
        const parsedRecurring = JSON.parse(recurring);
        this.recurringTransactions = new Map(parsedRecurring);
      }
    } catch (error) {
      console.error('Error loading auto-categorization data:', error);
    }
  }

  // Save categorization data
  saveData() {
    try {
      localStorage.setItem('finguard-category-rules', 
        JSON.stringify([...this.categoryRules]));
      localStorage.setItem('finguard-merchant-patterns', 
        JSON.stringify([...this.merchantPatterns]));
      localStorage.setItem('finguard-recurring-transactions', 
        JSON.stringify([...this.recurringTransactions]));
    } catch (error) {
      console.error('Error saving auto-categorization data:', error);
    }
  }

  // Automatically categorize a transaction
  categorizeTransaction(transaction) {
    const { description, amount, date, category } = transaction;
    
    // Skip if already categorized manually
    if (category && category !== 'Other' && category !== 'Uncategorized') {
      this.learnFromTransaction(transaction);
      return category;
    }
    
    // Try different categorization methods
    let suggestedCategory = null;
    let confidence = 0;
    
    // Method 1: Exact merchant match
    const merchantMatch = this.findMerchantMatch(description);
    if (merchantMatch) {
      suggestedCategory = merchantMatch.category;
      confidence = merchantMatch.confidence;
    }
    
    // Method 2: Pattern matching
    if (!suggestedCategory || confidence < 0.8) {
      const patternMatch = this.findPatternMatch(description);
      if (patternMatch && patternMatch.confidence > confidence) {
        suggestedCategory = patternMatch.category;
        confidence = patternMatch.confidence;
      }
    }
    
    // Method 3: Amount-based rules
    if (!suggestedCategory || confidence < 0.7) {
      const amountMatch = this.findAmountBasedCategory(amount, description);
      if (amountMatch && amountMatch.confidence > confidence) {
        suggestedCategory = amountMatch.category;
        confidence = amountMatch.confidence;
      }
    }
    
    // Learn from this transaction
    if (suggestedCategory) {
      this.learnFromTransaction({
        ...transaction,
        category: suggestedCategory,
        autoGenerated: true,
        confidence
      });
    }
    
    return {
      category: suggestedCategory || 'Other',
      confidence,
      autoGenerated: true,
      method: suggestedCategory ? 'auto' : 'default'
    };
  }

  // Find exact merchant match
  findMerchantMatch(description) {
    const cleanDesc = description.toLowerCase().trim();
    
    for (const [merchant, data] of this.merchantPatterns) {
      if (cleanDesc.includes(merchant.toLowerCase())) {
        return {
          category: data.category,
          confidence: data.confidence || 0.9
        };
      }
    }
    
    return null;
  }

  // Find pattern-based match
  findPatternMatch(description) {
    const cleanDesc = description.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;
    
    for (const [category, patterns] of Object.entries(this.categoryPatterns)) {
      let score = 0;
      let matchCount = 0;
      
      for (const pattern of patterns) {
        if (cleanDesc.includes(pattern.toLowerCase())) {
          matchCount++;
          // Longer patterns get higher scores
          score += pattern.length / cleanDesc.length;
        }
      }
      
      if (matchCount > 0) {
        const finalScore = (score * matchCount) / patterns.length;
        if (finalScore > highestScore) {
          highestScore = finalScore;
          bestMatch = {
            category: this.formatCategoryName(category),
            confidence: Math.min(0.8, 0.4 + finalScore),
            matchCount
          };
        }
      }
    }
    
    return bestMatch;
  }

  // Find amount-based category
  findAmountBasedCategory(amount, description) {
    const absAmount = Math.abs(amount);
    
    // Small amounts might be coffee/snacks
    if (absAmount <= 10 && description.toLowerCase().includes('coff')) {
      return { category: 'Food & Dining', confidence: 0.6 };
    }
    
    // Large amounts might be rent/mortgage
    if (absAmount >= 1000) {
      return { category: 'Housing', confidence: 0.5 };
    }
    
    // Gas transactions are usually between $20-$80
    if (absAmount >= 20 && absAmount <= 80 && 
        description.toLowerCase().includes('gas')) {
      return { category: 'Transportation', confidence: 0.7 };
    }
    
    return null;
  }

  // Learn from a transaction to improve future categorization
  learnFromTransaction(transaction) {
    const { description, category, amount } = transaction;
    
    if (!description || !category || category === 'Other') return;
    
    // Extract merchant name (simplified)
    const merchant = this.extractMerchantName(description);
    if (merchant) {
      const existing = this.merchantPatterns.get(merchant);
      if (existing) {
        // Update confidence based on consistency
        if (existing.category === category) {
          existing.confidence = Math.min(0.95, existing.confidence + 0.05);
          existing.count = (existing.count || 1) + 1;
        } else {
          // Conflicting categorization, reduce confidence
          existing.confidence = Math.max(0.5, existing.confidence - 0.1);
        }
      } else {
        // New merchant
        this.merchantPatterns.set(merchant, {
          category,
          confidence: 0.7,
          count: 1,
          averageAmount: Math.abs(amount),
          lastSeen: new Date().toISOString()
        });
      }
    }
    
    // Save learned data
    this.saveData();
  }

  // Extract merchant name from description
  extractMerchantName(description) {
    // Remove common prefixes and suffixes
    let merchant = description
      .replace(/^(DEBIT|CREDIT|ACH|CHECK|TRANSFER)\s*/i, '')
      .replace(/\s*\d{4}$/, '') // Remove last 4 digits
      .replace(/\s*#\d+.*$/, '') // Remove reference numbers
      .replace(/\s*-\s*.*$/, '') // Remove everything after dash
      .trim();
    
    // Take first meaningful part
    const parts = merchant.split(/\s+/);
    if (parts.length > 0) {
      merchant = parts.slice(0, Math.min(2, parts.length)).join(' ');
    }
    
    return merchant.length >= 3 ? merchant : null;
  }

  // Detect recurring transactions
  detectRecurringTransactions(transactions) {
    const groups = this.groupSimilarTransactions(transactions);
    const recurringPatterns = [];
    
    for (const [key, group] of groups.entries()) {
      if (group.length >= this.recurringSettings.minOccurrences) {
        const pattern = this.analyzeRecurringPattern(group);
        if (pattern) {
          recurringPatterns.push({
            id: key,
            pattern,
            transactions: group,
            nextExpected: this.predictNextOccurrence(pattern, group)
          });
          
          // Store in recurring transactions map
          this.recurringTransactions.set(key, {
            ...pattern,
            transactions: group.map(t => ({ id: t.id, date: t.date, amount: t.amount })),
            lastUpdated: new Date().toISOString()
          });
        }
      }
    }
    
    this.saveData();
    this.emit('recurring-detected', recurringPatterns);
    
    return recurringPatterns;
  }

  // Group similar transactions
  groupSimilarTransactions(transactions) {
    const groups = new Map();
    
    for (const transaction of transactions) {
      const key = this.generateTransactionKey(transaction);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(transaction);
    }
    
    return groups;
  }

  // Generate a key for grouping similar transactions
  generateTransactionKey(transaction) {
    const { description, amount } = transaction;
    const normalizedDesc = this.extractMerchantName(description) || description;
    const amountRange = Math.floor(Math.abs(amount) / 10) * 10; // Group by $10 ranges
    
    return `${normalizedDesc.toLowerCase()}_${amountRange}`;
  }

  // Analyze if a group forms a recurring pattern
  analyzeRecurringPattern(transactions) {
    if (transactions.length < this.recurringSettings.minOccurrences) {
      return null;
    }
    
    // Sort by date
    const sorted = transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    const intervals = [];
    const amounts = sorted.map(t => Math.abs(t.amount));
    
    // Calculate intervals between transactions
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.floor(
        (new Date(sorted[i].date) - new Date(sorted[i-1].date)) / (1000 * 60 * 60 * 24)
      );
      intervals.push(days);
    }
    
    // Check for monthly pattern (28-31 days)
    const monthlyIntervals = intervals.filter(d => d >= 25 && d <= 35);
    const weeklyIntervals = intervals.filter(d => d >= 5 && d <= 9);
    const biweeklyIntervals = intervals.filter(d => d >= 12 && d <= 16);
    
    let frequency = null;
    let avgInterval = 0;
    
    if (monthlyIntervals.length >= intervals.length * 0.7) {
      frequency = 'monthly';
      avgInterval = monthlyIntervals.reduce((a, b) => a + b, 0) / monthlyIntervals.length;
    } else if (weeklyIntervals.length >= intervals.length * 0.7) {
      frequency = 'weekly';
      avgInterval = weeklyIntervals.reduce((a, b) => a + b, 0) / weeklyIntervals.length;
    } else if (biweeklyIntervals.length >= intervals.length * 0.7) {
      frequency = 'biweekly';
      avgInterval = biweeklyIntervals.reduce((a, b) => a + b, 0) / biweeklyIntervals.length;
    }
    
    if (!frequency) return null;
    
    // Check amount consistency
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariation = amounts.map(a => Math.abs(a - avgAmount) / avgAmount);
    const maxVariation = Math.max(...amountVariation);
    
    if (maxVariation > this.recurringSettings.maxAmountVariation) {
      return null;
    }
    
    return {
      frequency,
      avgInterval: Math.round(avgInterval),
      avgAmount: Math.round(avgAmount * 100) / 100,
      maxAmountVariation: Math.round(maxVariation * 100) / 100,
      confidence: this.calculateRecurringConfidence(intervals, amounts),
      merchant: this.extractMerchantName(sorted[0].description),
      category: sorted[0].category || 'Other',
      type: avgAmount > 0 ? 'income' : 'expense'
    };
  }

  // Calculate confidence score for recurring pattern
  calculateRecurringConfidence(intervals, amounts) {
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalVariation = intervals.map(i => Math.abs(i - avgInterval) / avgInterval);
    const maxIntervalVariation = Math.max(...intervalVariation);
    
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariation = amounts.map(a => Math.abs(a - avgAmount) / avgAmount);
    const maxAmountVariation = Math.max(...amountVariation);
    
    // Higher confidence for lower variation and more occurrences
    const intervalScore = Math.max(0, 1 - maxIntervalVariation);
    const amountScore = Math.max(0, 1 - maxAmountVariation);
    const frequencyScore = Math.min(1, intervals.length / 6);
    
    return Math.round((intervalScore * 0.4 + amountScore * 0.4 + frequencyScore * 0.2) * 100) / 100;
  }

  // Predict next occurrence of recurring transaction
  predictNextOccurrence(pattern, transactions) {
    if (!transactions || transactions.length === 0) return null;
    
    const lastTransaction = transactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const lastDate = new Date(lastTransaction.date);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + pattern.avgInterval);
    
    return {
      date: nextDate.toISOString().split('T')[0],
      estimatedAmount: pattern.avgAmount,
      confidence: pattern.confidence,
      description: lastTransaction.description,
      category: pattern.category
    };
  }

  // Format category name
  formatCategoryName(category) {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' & ');
  }

  // Start background processing
  startBackgroundProcessing() {
    // Process transactions every 5 minutes
    setInterval(() => {
      this.processRecentTransactions();
    }, 5 * 60 * 1000);
    
    // Clean old data weekly
    setInterval(() => {
      this.cleanOldData();
    }, 7 * 24 * 60 * 60 * 1000);
  }

  // Process recent transactions
  async processRecentTransactions() {
    try {
      // This would typically fetch from your API
      const recentTransactions = await this.fetchRecentTransactions();
      
      if (recentTransactions && recentTransactions.length > 0) {
        // Auto-categorize new transactions
        const categorized = recentTransactions.map(t => ({
          ...t,
          ...this.categorizeTransaction(t)
        }));
        
        // Detect new recurring patterns
        this.detectRecurringTransactions(recentTransactions);
        
        this.emit('transactions-processed', categorized);
      }
    } catch (error) {
      console.error('Error processing recent transactions:', error);
    }
  }

  // Fetch recent transactions (placeholder)
  async fetchRecentTransactions() {
    // This would fetch from your actual API
    // For now, return empty array
    return [];
  }

  // Clean old data
  cleanOldData() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Clean old recurring transaction data
    for (const [key, data] of this.recurringTransactions.entries()) {
      if (new Date(data.lastUpdated) < sixMonthsAgo) {
        this.recurringTransactions.delete(key);
      }
    }
    
    this.saveData();
  }

  // Get all recurring transactions
  getRecurringTransactions() {
    return Array.from(this.recurringTransactions.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  // Get categorization suggestions for a transaction
  getCategorysuggestions(transaction) {
    const result = this.categorizeTransaction(transaction);
    
    // Get alternative suggestions
    const alternatives = [];
    const description = transaction.description.toLowerCase();
    
    for (const [category, patterns] of Object.entries(this.categoryPatterns)) {
      let matchScore = 0;
      for (const pattern of patterns) {
        if (description.includes(pattern.toLowerCase())) {
          matchScore++;
        }
      }
      
      if (matchScore > 0) {
        alternatives.push({
          category: this.formatCategoryName(category),
          confidence: Math.min(0.8, matchScore / patterns.length),
          reason: `Matched ${matchScore} patterns`
        });
      }
    }
    
    // Sort by confidence
    alternatives.sort((a, b) => b.confidence - a.confidence);
    
    return {
      primary: result,
      alternatives: alternatives.slice(0, 3)
    };
  }

  // Update category rule
  updateCategoryRule(merchant, category) {
    this.merchantPatterns.set(merchant, {
      category,
      confidence: 0.9,
      count: 1,
      lastSeen: new Date().toISOString()
    });
    
    this.saveData();
    this.emit('rule-updated', { merchant, category });
  }

  // Delete category rule
  deleteCategoryRule(merchant) {
    const deleted = this.merchantPatterns.delete(merchant);
    if (deleted) {
      this.saveData();
      this.emit('rule-deleted', { merchant });
    }
    return deleted;
  }

  // Get categorization statistics
  getCategorizationStats() {
    return {
      totalRules: this.merchantPatterns.size,
      recurringTransactions: this.recurringTransactions.size,
      categoryPatterns: Object.keys(this.categoryPatterns).length,
      lastUpdated: new Date().toISOString()
    };
  }

  // Event emitter methods
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

// Create and export singleton instance
const autoCategorizationService = new AutoCategorizationService();

// Initialize on app load
if (typeof window !== 'undefined') {
  // Initialize after a short delay to allow other services to load
  setTimeout(() => {
    autoCategorizationService.initialize();
  }, 1000);
}

export default autoCategorizationService;