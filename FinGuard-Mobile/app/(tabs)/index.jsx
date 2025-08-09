import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const App = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {/* Add your logo here */}
          <Text style={styles.logoText}>FinGuard</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            FinGuard – Your{'\n'}
            Smarter Financial{'\n'}
            Future, Powered By AI
          </Text>
          
          <Text style={styles.heroSubtitle}>
            Take control of your money with FinGuard—the AI-driven financial assistant 
            that doesn't just track your spending, but actively helps you save, budget, and grow.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton}>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={styles.primaryButtonText}>Get Started for Free  
                  </Text>
               </Pressable>
              </Link>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Why FinGuard Section */}
        <View style={styles.whySection}>
          <Text style={styles.sectionTitle}>Why FinGuard?</Text>
          <Text style={styles.sectionSubtitle}>
            FinGuard goes beyond basic budgeting with AI that thinks ahead.
          </Text>
          
          {/* Feature Cards */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🤖</Text>
              </View>
              <Text style={styles.featureTitle}>AI-Powered Insights</Text>
              <Text style={styles.featureDescription}>
                Smart analysis of your spending patterns with personalized recommendations
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>📊</Text>
              </View>
              <Text style={styles.featureTitle}>Smart Budgeting</Text>
              <Text style={styles.featureDescription}>
                Automated budget creation and real-time spending alerts
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>💰</Text>
              </View>
              <Text style={styles.featureTitle}>Growth Tracking</Text>
              <Text style={styles.featureDescription}>
                Monitor your financial growth with detailed analytics and projections
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#a0a0b0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: '#4ade80',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#4ade80',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#0f0f23',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#4ade80',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  whySection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#a0a0b0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 20,
  },
  featureCard: {
    backgroundColor: '#1a1a2e',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#4ade80',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 14,
    color: '#a0a0b0',
    lineHeight: 20,
  },
});

export default App;