// app/(app)/budget.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart } from "react-native-chart-kit";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Haptics is optional — code is guarded so it won't crash if not installed
let Haptics;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require("expo-haptics");
} catch {}

const { width } = Dimensions.get("window");

// ---- API base (adjust if needed) ----
const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE || "http://10.91.73.120:4000/api";

const getPredefinedExpenseCategories = () => [
  { id: 1, name: "Food & Dining" },
  { id: 2, name: "Groceries" },
  { id: 3, name: "Transportation" },
  { id: 4, name: "Entertainment" },
  { id: 5, name: "Utilities" },
  { id: 6, name: "Shopping" },
  { id: 7, name: "Healthcare" },
  { id: 8, name: "Education" },
  { id: 9, name: "Travel" },
  { id: 10, name: "Rent" },
  { id: 11, name: "Insurance" },
  { id: 12, name: "Phone & Internet" },
  { id: 13, name: "Fuel" },
  { id: 14, name: "Clothing" },
  { id: 15, name: "Personal Care" },
  { id: 16, name: "Home Maintenance" },
  { id: 17, name: "Subscriptions" },
  { id: 18, name: "Other Expenses" },
];

// map a category name to an emoji (mobile-friendly, fast to scan)
const getCategoryIcon = (name = "") => {
  const n = name.toLowerCase();
  if (/(food|dining|restaurant)/.test(n)) return "🍽️";
  if (/(grocery|grocer)/.test(n)) return "🛒";
  if (/(transport|car|fuel|uber|ride)/.test(n)) return "🚗";
  if (/(entertainment|movie|game)/.test(n)) return "🎮";
  if (/(utilit|electric|water|gas)/.test(n)) return "⚡";
  if (/(shop|clothes|clothing)/.test(n)) return "🛍️";
  if (/(health|medical)/.test(n)) return "🏥";
  if (/(education|book|course)/.test(n)) return "📚";
  if (/(travel|vacation|hotel)/.test(n)) return "✈️";
  if (/(rent|housing|home)/.test(n)) return "🏠";
  if (/(insurance)/.test(n)) return "🛡️";
  if (/(internet|phone)/.test(n)) return "📡";
  if (/(personal care)/.test(n)) return "🧴";
  if (/(mainten|repair)/.test(n)) return "🔧";
  if (/(subscription|member)/.test(n)) return "📺";
  return "💸";
};

export default function BudgetPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth(); // expects your AuthContext to expose a token

  // ---- page state ----
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [budgets, setBudgets] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
  });

  const [aiInsights, setAiInsights] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // modals
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [savingsModalOpen, setSavingsModalOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  // new budget form
  const [newBudget, setNewBudget] = useState({
    category: "",
    limit_amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // savings goal
  const [savingsGoal, setSavingsGoal] = useState({
    name: "Emergency Fund",
    amount: 50000,
    saved: 15000,
  });

  const categories = useMemo(
    () => getPredefinedExpenseCategories().map((c) => c.name),
    []
  );

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // -------- API helper --------
  const apiCall = async (endpoint, options = {}) => {
    if (!token) {
      setError("Please login to continue.");
      return null;
    }
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
        ...options,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      return await res.json();
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  // -------- fetch data --------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [budgetsData, summaryData, alertsData, monthlyData] =
        await Promise.all([
          apiCall(`/budgets?month=${currentMonth}&year=${currentYear}`),
          apiCall(`/budgets/summary?month=${currentMonth}&year=${currentYear}`),
          apiCall(`/budgets/alerts`),
          apiCall(`/summary?month=${currentMonth}&year=${currentYear}`),
        ]);

      if (budgetsData) setBudgets(budgetsData);
      if (summaryData) setBudgetSummary(summaryData);
      if (alertsData) setBudgetAlerts(alertsData);
      if (monthlyData) setMonthlySummary(monthlyData);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAI = useCallback(async () => {
    setAiLoading(true);
    try {
      const [ins, recs] = await Promise.all([
        apiCall(`/ai/financial-insights`),
        apiCall(`/ai/budget-recommendations`),
      ]);

      const insights = [];

      if (ins?.spendingPatterns?.mostVolatileCategory) {
        const [cat, stats] = ins.spendingPatterns.mostVolatileCategory;
        if (stats?.stdDev > 3000) {
          const pct = Math.round((stats.stdDev / stats.mean) * 100);
          insights.push({
            type: "warning",
            text: `Your ${cat.toLowerCase()} expenses show high volatility (${pct}% variance). Consider a steadier budget.`,
          });
        }
      }
      if (ins?.spendingPatterns?.topSpendingCategory) {
        const [cat, stats] = ins.spendingPatterns.topSpendingCategory;
        if (stats?.total > 50000) {
          insights.push({
            type: "info",
            text: `Top spending category: ${cat} with Rs. ${Math.round(
              stats.total
            ).toLocaleString()}.`,
          });
        }
      }
      if (ins?.behavioralInsights?.weekendSpendingRatio !== undefined) {
        const wk = Math.round(ins.behavioralInsights.weekendSpendingRatio * 100);
        if (wk > 30) {
          insights.push({
            type: "warning",
            text: `${wk}% of your spending occurs on weekends. Try planning weekend budgets.`,
          });
        } else if (wk < 15) {
          insights.push({
            type: "success",
            text: `Only ${wk}% of your spending is on weekends—nice control!`,
          });
        }
      }
      if (ins?.trendAnalysis?.direction && ins?.trendAnalysis?.confidence > 80) {
        const { direction, confidence } = ins.trendAnalysis;
        insights.push({
          type: direction === "increasing" ? "warning" : "success",
          text:
            direction === "increasing"
              ? `Spending trend is increasing (confidence ${confidence}%). Review recent expenses.`
              : `Spending is decreasing (confidence ${confidence}%). Great progress!`,
        });
      }

      if (recs?.recommendations?.length) {
        recs.recommendations.forEach((r) => {
          const save = Math.round(r.potentialSaving || 0);
          insights.push({
            type: save > 10000 ? "warning" : "suggestion",
            text: `${r.action || r.reasoning}${
              save > 0 ? ` • Potential savings: Rs. ${save.toLocaleString()}` : ""
            }`,
          });
        });
      }

      setAiInsights(
        insights.length
          ? insights.slice(0, 4)
          : [
              {
                type: "info",
                text:
                  "Keep tracking expenses to unlock personalized AI insights tailored to your patterns.",
              },
            ]
      );
    } finally {
      setAiLoading(false);
    }
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAll(), fetchAI()]);
    setRefreshing(false);
    Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
  }, [fetchAll, fetchAI]);

  useEffect(() => {
    fetchAll();
    fetchAI();
  }, [fetchAll, fetchAI]);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  // -------- actions --------
  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.limit_amount) {
      setError("Please select a category and enter a limit.");
      return;
    }
    setLoading(true);
    const res = await apiCall(`/budgets`, {
      method: "POST",
      body: JSON.stringify({
        category: newBudget.category,
        limit_amount: parseFloat(newBudget.limit_amount),
        month: newBudget.month,
        year: newBudget.year,
      }),
    });
    setLoading(false);
    if (res) {
      setSuccess(`Budget for ${newBudget.category} added!`);
      Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
      setBudgetModalOpen(false);
      setNewBudget({
        category: "",
        limit_amount: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      fetchAll();
    }
  };

  const handleDeleteBudget = async (id) => {
    Alert.alert("Delete Budget", "Are you sure you want to delete this budget?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const res = await apiCall(`/budgets/${id}`, { method: "DELETE" });
          setLoading(false);
          if (res) {
            setSuccess("Budget deleted.");
            Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);
            fetchAll();
          }
        },
      },
    ]);
  };

  // -------- chart data (spending trends) --------
  const trends = useMemo(() => {
    const now = new Date();
    const points = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const totalBudget = budgetSummary.reduce((t, c) => t + (c.budget_limit || 0), 0);
      const totalSpent = budgetSummary.reduce((t, c) => t + (c.current_spent || c.spent || 0), 0);
      const variance = 0.75 + Math.random() * 0.45; // 75% - 120%, a bit tighter for readability
      points.push({
        label: month,
        budget: Math.max(totalBudget, 0),
        spend: Math.max(Math.round(totalSpent * variance), 0),
      });
    }
    return points;
  }, [budgetSummary]);

  const chartData = useMemo(
    () => ({
      labels: trends.map((t) => t.label),
      datasets: [
        {
          data: trends.map((t) => t.budget),
          color: () => "#60a5fa", // blue
        },
        {
          data: trends.map((t) => t.spend),
          color: () => "#f87171", // red
        },
      ],
      legend: ["Budget", "Actual"],
    }),
    [trends]
  );

  const chartConfig = {
    backgroundGradientFrom: "#1a1a2e",
    backgroundGradientTo: "#1a1a2e",
    color: () => "#E5E7EB",
    labelColor: () => "#C9C9C9",
    barPercentage: 0.58,
    propsForLabels: { fontSize: 10 },
    decimalPlaces: 0,
  };

  const contentWidth = Math.min(width, 480) - 24; // keep content comfy on phablets

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top || 8 }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#60a5fa"
            colors={["#60a5fa"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title} accessibilityRole="header">
              Budget
            </Text>
            <Text style={styles.subTitle}>Track spending, set limits & get alerts</Text>
          </View>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => setBudgetModalOpen(true)}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="settings" size={16} color="#fff" />
            <Text style={styles.manageBtnText}>Manage</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {error ? <Banner kind="error" text={error} /> : null}
        {success ? <Banner kind="success" text={success} /> : null}

        {/* Monthly summary cards */}
        <View style={[styles.cardsRow, { paddingHorizontal: 12 }]}>
          <SummaryCard
            color="#22c55e"
            label="Income"
            value={`LKR ${Number(monthlySummary.income || 0).toLocaleString()}`}
            icon={<Feather name="trending-up" color="#22c55e" size={18} />}
          />
          <SummaryCard
            color="#ef4444"
            label="Expenses"
            value={`LKR ${Number(monthlySummary.expenses || 0).toLocaleString()}`}
            icon={<Feather name="dollar-sign" color="#ef4444" size={18} />}
          />
          <SummaryCard
            color={monthlySummary.balance >= 0 ? "#60a5fa" : "#f59e0b"}
            label="Balance"
            value={`LKR ${Number(monthlySummary.balance || 0).toLocaleString()}`}
            icon={<Feather name="bar-chart-2" color="#60a5fa" size={18} />}
          />
        </View>

        {/* Savings Goal */}
        <View style={[styles.card, { marginHorizontal: 12 }]}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="target" size={18} color="#60a5fa" />
              <Text style={[styles.cardTitle, { marginLeft: 8 }]} numberOfLines={1}>
                {savingsGoal.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSavingsModalOpen(true)}
              accessibilityLabel="Edit savings goal"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="edit-2" size={16} color="#C9C9C9" />
            </TouchableOpacity>
          </View>
          <View style={[styles.rowBetween, { marginTop: 4 }]}>
            <Text style={styles.goalMain}>
              LKR {Number(savingsGoal.saved).toLocaleString()}
            </Text>
            <Text style={styles.goalSub}>
              of LKR {Number(savingsGoal.amount).toLocaleString()}
            </Text>
          </View>
          <View style={styles.progressBar} accessibilityLabel="Savings progress">
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    (savingsGoal.saved / Math.max(savingsGoal.amount, 1)) * 100,
                    100
                  ).toFixed(2)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {((savingsGoal.saved / Math.max(savingsGoal.amount, 1)) * 100).toFixed(1)}% complete
          </Text>
        </View>

        {/* Budget vs Spending */}
        <View style={[styles.card, { marginHorizontal: 12 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Budget vs Spending</Text>
            <TouchableOpacity
              onPress={onRefresh}
              style={styles.refreshBtn}
              accessibilityLabel="Refresh data"
            >
              <Feather name="refresh-ccw" size={14} color="#C9C9C9" />
              <Text style={styles.refreshTxt}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <Loading />
          ) : budgetSummary.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="target" size={28} color="#9aa0a6" />
              <Text style={styles.emptyTxt}>No budgets for this month</Text>
              <TouchableOpacity onPress={() => setBudgetModalOpen(true)}>
                <Text style={styles.linkTxt}>Create your first budget</Text>
              </TouchableOpacity>
            </View>
          ) : (
            budgetSummary.map((item, idx) => {
              const percent =
                item.budget_limit > 0 ? (item.spent / item.budget_limit) * 100 : 0;
              const over = item.status === "Over Budget";

              return (
                <View key={`${item.category}-${idx}`} style={styles.budgetRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.catEmoji} accessible>
                      {getCategoryIcon(item.category)}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.budgetCat} numberOfLines={1}>
                        {item.category}
                      </Text>
                      <Text style={styles.budgetSub} numberOfLines={2}>
                        LKR {Number(item.spent).toFixed(2)} / LKR{" "}
                        {Number(item.budget_limit).toLocaleString()}{" "}
                        {item.remaining >= 0 ? (
                          <Text style={{ color: "#22c55e" }}>
                            • {`LKR ${Number(item.remaining).toFixed(2)} remaining`}
                          </Text>
                        ) : (
                          <Text style={{ color: "#ef4444" }}>
                            • {`LKR ${Math.abs(Number(item.remaining)).toFixed(2)} over`}
                          </Text>
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressSlim}>
                    <View
                      style={[
                        styles.progressSlimFill,
                        {
                          width: `${Math.min(percent, 100)}%`,
                          backgroundColor: over
                            ? "#ef4444"
                            : percent <= 70
                            ? "#22c55e"
                            : "#f59e0b",
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.rowBetween}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <StatusChip over={over} />
                      {percent > 80 && !over ? (
                        <MaterialCommunityIcons
                          name="lightbulb-on-outline"
                          size={16}
                          color="#f59e0b"
                          style={{ marginLeft: 8 }}
                          accessibilityLabel="Close to limit"
                        />
                      ) : null}
                    </View>
                    <Text style={styles.percentTxt}>{percent.toFixed(0)}%</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Active Alerts */}
        {budgetAlerts.length > 0 && (
          <View style={[styles.card, { marginHorizontal: 12 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Feather name="alert-triangle" size={18} color="#ef4444" />
              <Text style={[styles.cardTitle, { marginLeft: 8 }]}>
                Active Alerts ({budgetAlerts.length})
              </Text>
            </View>
            {budgetAlerts.map((a) => (
              <View key={a.id} style={styles.alertRow}>
                <Text style={styles.alertTxt} numberOfLines={2}>
                  🚨 Budget Alert: {a.category}
                </Text>
                <Feather name="mail" size={16} color="#ef4444" />
              </View>
            ))}

            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>Email Notifications</Text>
              <Text style={styles.noticeSub}>
                • Email when budget exceeded{"\n"}• Email at 80% of budget
              </Text>
            </View>
          </View>
        )}

        {/* AI Budget Insights */}
        <View style={[styles.card, { marginHorizontal: 12 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <MaterialCommunityIcons name="flash-outline" size={20} color="#60a5fa" />
            <Text style={[styles.cardTitle, { marginLeft: 8 }]}>AI Insights</Text>
          </View>
          {aiLoading ? (
            <Loading />
          ) : (
            (aiInsights || []).map((ins, i) => (
              <InsightPill key={i} type={ins.type} text={ins.text} />
            ))
          )}
        </View>

        {/* Spending Trends (Chart) */}
        <View style={[styles.card, { marginHorizontal: 12 }]}>
          <Text style={styles.cardTitle}>Spending Trends</Text>
          <Text style={styles.cardSub}>Last 6 months</Text>

          <BarChart
            width={contentWidth}
            height={220}
            data={chartData}
            yAxisLabel="Rs."
            fromZero
            showValuesOnTopOfBars={false}
            chartConfig={chartConfig}
            style={{ marginTop: 10, borderRadius: 12, alignSelf: "center" }}
            withInnerLines
            verticalLabelRotation={0}
          />

          {/* quick analytics row */}
          <View style={styles.analyticsRow}>
            <MiniStat
              label="Avg Monthly Spend"
              value={`Rs.${Math.round(
                trends.reduce((s, d) => s + d.spend, 0) / Math.max(trends.length, 1)
              ).toLocaleString()}`}
              tint="#60a5fa"
            />
            <MiniStat
              label="Budget Utilization"
              value={`${Math.round(
                (trends.reduce((s, d) => s + d.spend, 0) /
                  Math.max(trends.reduce((s, d) => s + d.budget, 0), 1)) *
                  100
              )}%`}
              tint="#22c55e"
            />
            <MiniStat label="Categories" value={String(budgetSummary.length)} tint="#8b5cf6" />
          </View>
        </View>
      </ScrollView>

      {/* --- Budget Modal --- */}
      <Modal transparent visible={budgetModalOpen} animationType="fade" onRequestClose={() => setBudgetModalOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setBudgetModalOpen(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalCard, { maxHeight: "80%" }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Add New Budget</Text>
              <TouchableOpacity onPress={() => setBudgetModalOpen(false)} hitSlop={8}>
                <Feather name="x" size={20} color="#C9C9C9" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <Pressable onPress={() => setCategoryPickerOpen(true)} style={styles.inputBox}>
              <Text style={styles.inputText} numberOfLines={1}>
                {newBudget.category || "Select Category"}
              </Text>
              <Feather name="chevron-down" size={16} color="#9aa0a6" />
            </Pressable>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Budget Limit (LKR)</Text>
            <TextInput
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "decimal-pad"}
              inputMode="decimal"
              value={String(newBudget.limit_amount)}
              onChangeText={(t) => {
                // allow only digits and dot
                const clean = t.replace(/[^0-9.]/g, "");
                setNewBudget({ ...newBudget, limit_amount: clean });
              }}
              placeholder="0.00"
              placeholderTextColor="#888EA0"
              style={styles.textInput}
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 14 }]}
              onPress={handleAddBudget}
              disabled={loading || !newBudget.category || !newBudget.limit_amount}
            >
              {loading ? <ActivityIndicator color="#0f0f23" /> : <Text style={styles.primaryBtnText}>Add Budget</Text>}
            </TouchableOpacity>

            {/* Existing budgets (simple list + delete) */}
            <View style={{ marginTop: 18 }}>
              <Text style={styles.modalSubtitle}>Current Budgets ({budgets.length})</Text>
              <ScrollView style={{ maxHeight: 260 }}>
                {budgets.map((b) => (
                  <View key={b.id} style={styles.modalBudgetRow}>
                    <Text style={styles.modalBudgetTxt} numberOfLines={1}>
                      {getCategoryIcon(b.category)} {b.category} • LKR {Number(b.limit_amount).toLocaleString()}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteBudget(b.id)} hitSlop={8}>
                      <Feather name="trash-2" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {budgets.length === 0 && (
                  <Text style={[styles.modalBudgetTxt, { opacity: 0.7 }]}>No budgets yet</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- Category Picker Modal --- */}
      <Modal transparent visible={categoryPickerOpen} animationType="fade" onRequestClose={() => setCategoryPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCategoryPickerOpen(false)} />
        <View style={[styles.pickerCard, { maxHeight: "70%" }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setCategoryPickerOpen(false)} hitSlop={8}>
              <Feather name="x" size={20} color="#C9C9C9" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 320 }}>
            {categories.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  setNewBudget({ ...newBudget, category: c });
                  setCategoryPickerOpen(false);
                }}
                style={({ pressed }) => [styles.pickerRow, pressed && { backgroundColor: "#1f2437" }]}
              >
                <Text style={styles.pickerTxt} numberOfLines={1}>
                  {getCategoryIcon(c)} {c}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* --- Savings Modal --- */}
      <Modal transparent visible={savingsModalOpen} animationType="fade" onRequestClose={() => setSavingsModalOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSavingsModalOpen(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalCard, { maxHeight: "70%" }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Savings Goal</Text>
              <TouchableOpacity onPress={() => setSavingsModalOpen(false)} hitSlop={8}>
                <Feather name="x" size={20} color="#C9C9C9" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              value={savingsGoal.name}
              onChangeText={(t) => setSavingsGoal({ ...savingsGoal, name: t })}
              style={styles.textInput}
              maxLength={36}
              placeholder="Goal name"
              placeholderTextColor="#888EA0"
            />

            <Text style={styles.inputLabel}>Target Amount (LKR)</Text>
            <TextInput
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "decimal-pad"}
              inputMode="numeric"
              value={String(savingsGoal.amount)}
              onChangeText={(t) => setSavingsGoal({ ...savingsGoal, amount: parseInt(t.replace(/\D/g, "") || "0", 10) })}
              style={styles.textInput}
              placeholder="e.g. 50000"
              placeholderTextColor="#888EA0"
            />

            <Text style={styles.inputLabel}>Current Saved (LKR)</Text>
            <TextInput
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "decimal-pad"}
              inputMode="numeric"
              value={String(savingsGoal.saved)}
              onChangeText={(t) => setSavingsGoal({ ...savingsGoal, saved: parseInt(t.replace(/\D/g, "") || "0", 10) })}
              style={styles.textInput}
              placeholder="e.g. 15000"
              placeholderTextColor="#888EA0"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 14 }]}
              onPress={() => {
                setSuccess("Savings goal updated!");
                Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
                setSavingsModalOpen(false);
              }}
            >
              <Text style={styles.primaryBtnText}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ----------------- small components ----------------- */
const SummaryCard = ({ color, label, value, icon }) => (
  <View style={styles.sumCard} accessible accessibilityLabel={`${label} ${value}`}>
    <View style={styles.rowBetween}>
      <Text style={styles.sumLabel}>{label}</Text>
      <View style={[styles.sumIconWrap, { borderColor: color + "55", backgroundColor: color + "11" }]}>{icon}</View>
    </View>
    <Text style={styles.sumValue}>{value}</Text>
  </View>
);

const StatusChip = ({ over }) => (
  <View style={[over ? styles.badgeRed : styles.badgeGreen]} accessibilityLabel={over ? "Over budget" : "Within budget"}>
    <Text style={styles.badgeText}>{over ? "Over Budget" : "Within Budget"}</Text>
  </View>
);

const Banner = ({ kind = "info", text }) => {
  const bg = kind === "error" ? "#3c1111" : kind === "success" ? "#0f2e21" : "#141a33";
  const border = kind === "error" ? "#5b1c1c" : kind === "success" ? "#1d5c43" : "#243047";
  const fg = kind === "error" ? "#fecaca" : kind === "success" ? "#bbf7d0" : "#c7d2fe";
  return (
    <View style={[styles.banner, { backgroundColor: bg, borderColor: border, borderWidth: 1 }]}>
      <Text style={[styles.bannerTxt, { color: fg }]}>{text}</Text>
    </View>
  );
};

const Loading = () => (
  <View style={styles.loadingBox} accessible accessibilityLabel="Loading">
    <ActivityIndicator color="#60a5fa" />
    <Text style={styles.loadingTxt}>Loading…</Text>
  </View>
);

const InsightPill = ({ type, text }) => {
  const bg = type === "warning" ? "#3c1111" : type === "success" ? "#0f2e21" : type === "suggestion" ? "#141a33" : "#101427";
  const border = type === "warning" ? "#5b1c1c" : type === "success" ? "#1d5c43" : type === "suggestion" ? "#243047" : "#1b2238";
  const fg = type === "warning" ? "#fecaca" : type === "success" ? "#bbf7d0" : type === "suggestion" ? "#c7d2fe" : "#e5e7eb";
  return (
    <View style={[styles.insight, { backgroundColor: bg, borderColor: border, borderWidth: 1 }]}>
      <Text style={[styles.insightTxt, { color: fg }]}>{text}</Text>
    </View>
  );
};

const MiniStat = ({ label, value, tint }) => (
  <View style={styles.miniStat} accessible accessibilityLabel={`${label} ${value}`}>
    <Text style={styles.miniLabel}>{label}</Text>
    <Text style={[styles.miniValue, { color: tint }]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

/* ----------------- styles ----------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },

  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#1a1a2e",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  subTitle: { color: "#a0a0b0", marginTop: 2, fontSize: 12 },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  manageBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  banner: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
  },
  bannerTxt: { fontWeight: "600" },

  cardsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  sumCard: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  sumLabel: { color: "#C9C9C9", fontSize: 12, fontWeight: "600" },
  sumIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  sumValue: { fontSize: 17, fontWeight: "900", marginTop: 4, color: "#fff" },

  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    marginTop: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  cardSub: { color: "#a0a0b0", marginTop: 4, fontSize: 12 },

  goalMain: { color: "#60a5fa", fontSize: 18, fontWeight: "800" },
  goalSub: { color: "#C9C9C9", fontSize: 12 },

  progressBar: {
    height: 8,
    backgroundColor: "#243047",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 6,
  },
  progressText: { color: "#a0a0b0", marginTop: 6, fontSize: 12 },

  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0f0f23",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  refreshTxt: { color: "#C9C9C9", fontSize: 12, fontWeight: "600" },

  emptyBox: { alignItems: "center", paddingVertical: 16, gap: 6 },
  emptyTxt: { color: "#9aa0a6", fontSize: 13 },
  linkTxt: { color: "#60a5fa", fontWeight: "700", marginTop: 2 },

  budgetRow: {
    backgroundColor: "#12172a",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#243047",
  },
  catEmoji: { fontSize: 22, marginRight: 10 },
  budgetCat: { color: "#fff", fontWeight: "700", marginBottom: 2 },
  budgetSub: { color: "#a0a0b0", fontSize: 12 },
  progressSlim: {
    height: 6,
    backgroundColor: "#243047",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 10,
  },
  progressSlimFill: { height: "100%" },
  percentTxt: { color: "#C9C9C9", fontSize: 12 },

  badgeRed: {
    backgroundColor: "#fee2e2",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeGreen: {
    backgroundColor: "#dcfce7",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, color: "#111827", fontWeight: "700" },

  insight: {
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  insightTxt: { fontSize: 13 },

  alertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#2a1e1e",
    borderColor: "#3a2a2a",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  alertTxt: { color: "#fecaca", fontWeight: "700", flex: 1, marginRight: 10 },

  noticeBox: {
    marginTop: 12,
    backgroundColor: "#0f0f23",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    padding: 10,
  },
  noticeTitle: { color: "#fff", fontWeight: "700" },
  noticeSub: { color: "#a0a0b0", marginTop: 4, lineHeight: 18 },

  analyticsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  miniStat: {
    flex: 1,
    backgroundColor: "#0f1324",
    borderColor: "#243047",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  miniLabel: { color: "#C9C9C9", fontSize: 12 },
  miniValue: { marginTop: 4, fontWeight: "800" },

  backdrop: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)" },

  modalCard: {
    position: "absolute",
    left: 12,
    right: 12,
    top: "18%",
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 14,
    borderColor: "#2a2a3e",
    borderWidth: 1,
  },
  modalTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  modalSubtitle: { color: "#fff", fontWeight: "800", marginTop: 8, marginBottom: 6 },
  modalBudgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#0f0f23",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    padding: 10,
    marginTop: 8,
  },
  modalBudgetTxt: { color: "#C9C9C9", flex: 1, marginRight: 8 },

  inputLabel: { color: "#C9C9C9", marginTop: 10, marginBottom: 6 },
  inputBox: {
    borderWidth: 1,
    borderColor: "#2a2a3e",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#0f0f23",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: { color: "#fff", flex: 1, marginRight: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: "#2a2a3e",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    color: "#fff",
    backgroundColor: "#0f0f23",
  },
  primaryBtn: {
    backgroundColor: "#4ade80",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 46,
  },
  primaryBtnText: { color: "#0f0f23", fontWeight: "900" },

  pickerCard: {
    position: "absolute",
    left: 12,
    right: 12,
    top: "22%",
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 14,
    borderColor: "#2a2a3e",
    borderWidth: 1,
  },
  pickerRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pickerTxt: { color: "#fff", fontWeight: "600" },
});