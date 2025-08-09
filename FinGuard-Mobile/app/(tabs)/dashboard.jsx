import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  
  // Dummy data
  const accountBalance = 15420.50;
  const monthlyBudget = 25000;
  const spent = 9579.50;
  const savings = 5841.00;
  
  const budgetPercentage = (spent / monthlyBudget) * 100;
  const savingsPercentage = (savings / monthlyBudget) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.phoneNumber}>Welcome Back!</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.greetingText}>FinGuard Dashboard</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <TouchableOpacity style={styles.reloadButton}>
              <Text style={styles.reloadText}>View Details</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>LKR {accountBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</Text>
          <Text style={styles.balanceSubtext}>Last updated: Today</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statCircle}>
              <Text style={styles.statNumber}>{Math.round(budgetPercentage)}%</Text>
            </View>
            <Text style={styles.statLabel}>Budget Used</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statCircle, styles.savingsCircle]}>
              <Text style={styles.statNumber}>{Math.round(savingsPercentage)}%</Text>
            </View>
            <Text style={styles.statLabel}>Savings Goal</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statCircle, styles.investmentCircle]}>
              <Text style={styles.statNumber}>12</Text>
            </View>
            <Text style={styles.statLabel}>Investments</Text>
          </View>
        </View>

        {/* Progress Sections */}
        <View style={styles.progressContainer}>
          {/* Monthly Spending */}
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Monthly Spending</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${budgetPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>LKR {spent.toLocaleString('en-IN')} of LKR {monthlyBudget.toLocaleString('en-IN')}</Text>
          </View>

          {/* Savings Progress */}
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Savings This Month</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, styles.savingsProgress, { width: `${savingsPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>LKR {savings.toLocaleString('en-IN')} saved</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionCard}>
            <View style={styles.transactionIcon}>
              <Text style={styles.transactionEmoji}>🍕</Text>
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>Food Delivery</Text>
              <Text style={styles.transactionDate}>Today, 2:30 PM</Text>
            </View>
            <Text style={styles.transactionAmount}>-LKR 450</Text>
          </View>

          <View style={styles.transactionCard}>
            <View style={styles.transactionIcon}>
              <Text style={styles.transactionEmoji}>🚗</Text>
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>Uber Ride</Text>
              <Text style={styles.transactionDate}>Yesterday, 6:15 PM</Text>
            </View>
            <Text style={styles.transactionAmount}>-LKR 280</Text>
          </View>

          <View style={styles.transactionCard}>
            <View style={[styles.transactionIcon, styles.incomeIcon]}>
              <Text style={styles.transactionEmoji}>💰</Text>
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>Salary Credit</Text>
              <Text style={styles.transactionDate}>Dec 1, 2024</Text>
            </View>
            <Text style={[styles.transactionAmount, styles.incomeAmount]}>+LKR 45,000</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🎯</Text>
              <Text style={styles.actionText}>Set Goals</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💳</Text>
              <Text style={styles.actionText}>Add Card</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navText}>Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.centerNavIcon}>
            <Text style={styles.centerIcon}>+</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🎯</Text>
          <Text style={styles.navText}>Goals</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneNumber: {
    color: '#a0a0b0',
    fontSize: 16,
    fontWeight: '500',
  },
  notificationButton: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  notificationIcon: {
    fontSize: 16,
  },
  greetingText: {
    color: '#4ade80',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  reloadButton: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reloadText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#000',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceSubtext: {
    color: '#999',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
  },
  statCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ff4757',
    marginBottom: 8,
  },
  savingsCircle: {
    borderColor: '#4ade80',
  },
  investmentCircle: {
    borderColor: '#3742fa',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  progressSection: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  progressTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a3e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff4757',
    borderRadius: 4,
  },
  savingsProgress: {
    backgroundColor: '#4ade80',
  },
  progressText: {
    color: '#a0a0b0',
    fontSize: 14,
  },
  transactionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  incomeIcon: {
    backgroundColor: '#4ade80',
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#a0a0b0',
    fontSize: 14,
  },
  transactionAmount: {
    color: '#ff4757',
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#4ade80',
  },
  quickActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    color: '#a0a0b0',
    fontSize: 12,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#4ade80',
  },
  centerNavIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default Dashboard;