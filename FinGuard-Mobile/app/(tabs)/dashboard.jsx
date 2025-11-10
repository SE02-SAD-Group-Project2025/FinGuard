// app/(app)/dashboard.js
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Pressable,
  Modal,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { PieChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // ---- Demo numbers (wire these to your backend when ready) ----
  const accountBalance = 15420.5;
  const monthlyBudget = 25000;
  const spent = 9579.5;
  const savings = 5841.0;
  const monthlyIncome = 45000;
  const liabilitiesTotal = 12875.0;

  const budgetPercentage = (spent / monthlyBudget) * 100;
  const savingsPercentage = (savings / monthlyBudget) * 100;

  // ---- Carousel data (UNCHANGED) ----
  const cards = useMemo(
    () => [
      {
        key: "balance",
        title: "Current Balance",
        value: `LKR ${accountBalance.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
        subtitle: "As of today",
        accent: "#22c55e", // green
      },
      {
        key: "liabilities",
        title: "Liabilities",
        value: `LKR ${liabilitiesTotal.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
        subtitle: "Outstanding total",
        accent: "#ef4444", // red
      },
      {
        key: "income",
        title: "Month's Income",
        value: `LKR ${monthlyIncome.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
        subtitle: new Date().toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
        accent: "#3b82f6", // blue
      },
      {
        key: "expense",
        title: "Month's Expense",
        value: `LKR ${spent.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
        subtitle: new Date().toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
        accent: "#f59e0b", // amber
      },
    ],
    [accountBalance, liabilitiesTotal, monthlyIncome, spent]
  );

  // ---- Layout & snapping (UNCHANGED) ----
  const SPACING = 16;
  const CARD_WIDTH = Math.round(width * 0.85);
  const ITEM_SIZE = CARD_WIDTH + SPACING;
  const SIDE_PAD = (width - CARD_WIDTH) / 2;

  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);
  const onMomentumEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_SIZE);
    setActive(idx);
  };

  // -------------------------
  // NEW: Income & Expense Charts (mobile-friendly)
  // -------------------------
  const incomeGroups = [
    { name: "Salary", amount: 38000, color: "#10b981" },
    { name: "Freelance", amount: 5000, color: "#34d399" },
    { name: "Investments", amount: 2000, color: "#6ee7b7" },
  ];

  const expenseGroups = [
    { name: "Food", amount: 2800, color: "#ef4444" },
    { name: "Transport", amount: 1450, color: "#f97316" },
    { name: "Bills", amount: 3000, color: "#eab308" },
    { name: "Shopping", amount: 2329.5, color: "#8b5cf6" },
  ];

  const chartWidth = Math.min(width - 40, 380);

  // -------------------------
  // NEW: Financial Health Score (simple mobile card)
  // -------------------------
  const financialHealthScore = getFinancialHealthScore({
    income: monthlyIncome,
    expenses: spent,
    balance: accountBalance,
    liabilities: liabilitiesTotal,
  });
  const healthColor = scoreToColor(financialHealthScore);

  // -------------------------
  // NEW: Mini Action Sheet state (fixes error)
  // -------------------------
  const [sheetOpen, setSheetOpen] = useState(false);

  // Open sheet from FAB
  function onQuickAdd() {
    setSheetOpen(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header (UNCHANGED) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.phoneNumber}>
            Welcome Back! {user?.username || user?.email || "User"}
          </Text>
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
        {/* ====== Manual Carousel (UNCHANGED) ====== */}
        <View style={{ marginTop: 16 }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_SIZE}
            decelerationRate="fast"
            snapToAlignment="center"
            contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
            onMomentumScrollEnd={onMomentumEnd}
            scrollEventThrottle={16}
          >
            {cards.map((item) => (
              <View
                key={item.key}
                style={[styles.card, { width: CARD_WIDTH, marginRight: SPACING }]}
              >
                <View style={[styles.cardAccent, { backgroundColor: item.accent }]} />
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>{item.title}</Text>
                  <TouchableOpacity
                    style={[styles.pillBtn, { backgroundColor: `${item.accent}22` }]}
                    onPress={() => {}}
                  >
                    <Text style={[styles.pillText, { color: item.accent }]}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardValue}>{item.value}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {cards.map((_, i) => (
              <View
                key={`dot-${i}`}
                style={[
                  styles.dot,
                  {
                    width: active === i ? 22 : 6,
                    opacity: active === i ? 1 : 0.35,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Quick Stats (UNCHANGED) */}
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

        {/* Progress Sections (UNCHANGED) */}
        <View style={styles.progressContainer}>
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Monthly Spending</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${budgetPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              LKR {spent.toLocaleString("en-IN")} of LKR {monthlyBudget.toLocaleString("en-IN")}
            </Text>
          </View>

          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Savings This Month</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  styles.savingsProgress,
                  { width: `${savingsPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              LKR {savings.toLocaleString("en-IN")} saved
            </Text>
          </View>
        </View>

        {/* Income & Expense Breakdown (Pie charts) */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Your Income & Expense Summary</Text>
          <Text style={{ color: "#a0a0b0", marginBottom: 12 }}>
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>

          {/* Expense Pie */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Expense Categories</Text>
            <PieChart
              data={expenseGroups.map((x) => ({
                name: x.name,
                population: x.amount,
                color: x.color,
                legendFontColor: "#C9C9C9",
                legendFontSize: 12,
              }))}
              width={chartWidth}
              height={210}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              hasLegend
              center={[0, 0]}
              absolute
            />
          </View>

          {/* Income Pie */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Income Sources</Text>
            <PieChart
              data={incomeGroups.map((x) => ({
                name: x.name,
                population: x.amount,
                color: x.color,
                legendFontColor: "#C9C9C9",
                legendFontSize: 12,
              }))}
              width={chartWidth}
              height={210}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              hasLegend
              center={[0, 0]}
              absolute
            />
          </View>
        </View>

        {/* Financial Health Score */}
        <View style={styles.healthCard}>
          <Text style={styles.healthTitle}>Financial Health Score</Text>
          <Text style={[styles.healthScore, { color: healthColor }]}>{financialHealthScore}</Text>
          <Text style={styles.healthHint}>{healthMessage(financialHealthScore)}</Text>
          <View style={styles.tipRow}>
            <Bullet>Keep expenses under 50% of income</Bullet>
            <Bullet>Automate monthly savings</Bullet>
            <Bullet>Reduce high-interest liabilities</Bullet>
          </View>
        </View>

        {/* Recent Transactions (demo) */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => {}}>
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

          <View style={[styles.transactionCard]}>
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
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={onQuickAdd}>
        <Text style={{ color: "#0f0f23", fontSize: 24, fontWeight: "900" }}>＋</Text>
      </TouchableOpacity>

      {/* Mini Action Sheet for FAB */}
      <Modal
        transparent
        visible={sheetOpen}
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <View />
        </Pressable>
        <View style={styles.sheetCard}>
          <Text style={styles.sheetTitle}>Quick Add</Text>
          <Pressable
            style={({ pressed }) => [styles.sheetBtn, pressed && { opacity: 0.9 }]}
            onPress={() => {
              setSheetOpen(false);
              router.push("/(app)/add-income");
            }}
          >
            <Text style={styles.sheetBtnText}>Add Income</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.sheetBtn, pressed && { opacity: 0.9 }]}
            onPress={() => {
              setSheetOpen(false);
              router.push("/(app)/add-expense");
            }}
          >
            <Text style={styles.sheetBtnText}>Add Expense</Text>
          </Pressable>
          <Pressable onPress={() => setSheetOpen(false)} style={styles.sheetCancel}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* --------- Helpers for Financial Health --------- */
function getFinancialHealthScore({ income, expenses, balance, liabilities }) {
  const savingsBufferMonths = balance / Math.max(1, expenses);
  let score = 50;

  if (income > 0) {
    const spendRatio = expenses / income;
    if (spendRatio <= 0.5) score += 25;
    else if (spendRatio <= 0.7) score += 15;
    else if (spendRatio <= 0.9) score += 5;
  }

  if (savingsBufferMonths >= 6) score += 20;
  else if (savingsBufferMonths >= 3) score += 10;
  else if (savingsBufferMonths >= 1) score += 5;

  if (liabilities > income * 6) score -= 15;
  else if (liabilities > income * 3) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreToColor(score) {
  if (score >= 75) return "#10b981"; // green
  if (score >= 50) return "#eab308"; // amber
  return "#ef4444"; // red
}

function healthMessage(score) {
  if (score >= 75) return "Great shape — keep growing your cushion!";
  if (score >= 50) return "Stable — trim expenses and boost savings.";
  return "Tight — focus on lowering debt & spending.";
}

const Bullet = ({ children }) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
    <View
      style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80", marginRight: 8 }}
    />
    <Text style={{ color: "#C9CFD6", fontSize: 13 }}>{children}</Text>
  </View>
);

/* --------- Chart config (react-native-chart-kit) --------- */
const chartConfig = {
  backgroundColor: "transparent",
  backgroundGradientFrom: "#1a1a2e",
  backgroundGradientTo: "#1a1a2e",
  decimalPlaces: 0,
  color: () => "#FFFFFF",
  labelColor: () => "#C9C9C9",
};

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },

  header: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  phoneNumber: { color: "#a0a0b0", fontSize: 16, fontWeight: "500" },
  notificationButton: {
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  notificationIcon: { fontSize: 16 },
  greetingText: { color: "#4ade80", fontSize: 24, fontWeight: "bold" },

  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  cardAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 6 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardLabel: { color: "#666", fontSize: 16, fontWeight: "600" },
  pillBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: "700" },
  cardValue: { color: "#000", fontSize: 30, fontWeight: "900", marginBottom: 4 },
  cardSub: { color: "#888", fontSize: 13, fontWeight: "500" },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  dot: { height: 6, borderRadius: 999, backgroundColor: "#4ade80", marginHorizontal: 3 },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  statCard: { alignItems: "center" },
  statCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#ff4757",
    marginBottom: 8,
  },
  savingsCircle: { borderColor: "#4ade80" },
  investmentCircle: { borderColor: "#3742fa" },
  statNumber: { fontSize: 18, fontWeight: "bold", color: "#000" },
  statLabel: { color: "#ffffff", fontSize: 12, textAlign: "center" },

  progressContainer: { marginHorizontal: 20, marginBottom: 20 },
  progressSection: {
    backgroundColor: "#1a1a2e",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  progressTitle: { color: "#ffffff", fontSize: 16, fontWeight: "600", marginBottom: 12 },
  progressBar: {
    height: 8,
    backgroundColor: "#2a2a3e",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#ff4757", borderRadius: 4 },
  savingsProgress: { backgroundColor: "#4ade80" },
  progressText: { color: "#a0a0b0", fontSize: 14 },

  chartCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
    borderColor: "#2a2a3e",
    borderWidth: 1,
  },
  chartTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", alignSelf: "flex-start", marginBottom: 6 },

  healthCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 18,
    borderColor: "#2a2a3e",
    borderWidth: 1,
  },
  healthTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  healthScore: { fontSize: 36, fontWeight: "900", marginTop: 6 },
  healthHint: { color: "#C9CFD6", marginTop: 6, fontSize: 13 },
  tipRow: { marginTop: 10 },

  transactionsContainer: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { color: "#ffffff", fontSize: 20, fontWeight: "bold" },
  viewAllText: { color: "#4ade80", fontSize: 14, fontWeight: "600" },
  transactionCard: {
    backgroundColor: "#1a1a2e",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ff4757",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  incomeIcon: { backgroundColor: "#4ade80" },
  transactionEmoji: { fontSize: 20 },
  transactionDetails: { flex: 1 },
  transactionTitle: { color: "#ffffff", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  transactionDate: { color: "#a0a0b0", fontSize: 14 },
  transactionAmount: { color: "#ff4757", fontSize: 16, fontWeight: "bold" },
  incomeAmount: { color: "#4ade80" },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4ade80",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
  },

  sheetBackdrop: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)" },
  sheetCard: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  sheetTitle: { color: "#fff", fontWeight: "800", fontSize: 16, marginBottom: 8 },
  sheetBtn: {
    backgroundColor: "#0f0f23",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  sheetBtnText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  sheetCancel: { marginTop: 10, alignItems: "center", paddingVertical: 8 },
  sheetCancelText: { color: "#a0a0b0", fontWeight: "600" },
});
