import React, { useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, StatusBar, Dimensions,
  Pressable, Platform, SafeAreaView, FlatList
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Theme tokens
const GREEN = "#4ADE80";
const GREEN_DARK = "#22C55E";
const BG_DARK = "#0f0f23";
const CARD_DARK = "#17172b";
const TEXT = "#FFFFFF";
const MUTED = "#C9CFD6";
const BORDER = "#2a2a3e";

const FEATURES = [
  { title: "AI Powered", text: "Learns your habits and adapts your budget.", iconSet: MaterialCommunityIcons, icon: "robot-outline", tag: "🧠", tagBg: "#FACC15" },
  { title: "Proactive", text: "Alerts you before you overspend.", iconSet: Feather, icon: "zap", tag: "⚡", tagBg: "#F87171" },
  { title: "Localized", text: "Sri Lanka-ready with LKR insights.", iconSet: FontAwesome, icon: "flag", tag: "🌍", tagBg: "#60A5FA" },
];

const TESTIMONIALS = [
  { name: "Ahinsa Udani", role: "Software Engineer", text: "Saved LKR 200,000 in 6 months. Tips are spot-on." },
  { name: "Ashan Fernando", role: "Business Owner", text: "Finally a budgeting app that understands Sri Lanka." },
  { name: "Anitha Perera", role: "Teacher", text: "Proactive alerts stopped me from overspending." },
];

const STATS = [
  { number: "10,000+", label: "Happy Users" },
  { number: "LKR 50M+", label: "Money Saved" },
  { number: "95%", label: "Satisfaction" },
  { number: "24/7", label: "AI Support" },
];

const App = () => {
  const router = useRouter();
  const styles = useMemo(() => createStyles(), []);

  const goRegister = () => router.push("/(auth)/register");

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#12122a" />
      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>FinGuard</Text>
        <Pressable
          style={styles.helpBtn}
          onPress={() => router.push("/support")}
          android_ripple={{ color: GREEN + "22" }}
          hitSlop={8}
        >
          <Feather name="help-circle" size={18} color={TEXT} />
          <Text style={styles.helpText}>Help</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.kicker}>🚀 New: AI-Powered Financial Assistant</Text>
          <Text style={styles.title}>
            Smarter{"\n"}
            <Text style={styles.titleAccent}>Financial Future</Text>
          </Text>
          <Text style={styles.subtitle}>
            Track, save, and grow with proactive AI—built for Sri Lanka.
          </Text>

          <View style={styles.ctaRow}>
            <PrimaryButton label="Get Started — Free" onPress={goRegister} />
            <GhostButton label="Learn More" onPress={() => router.push("/learn")} />
          </View>

          {/* Compact hero card */}
          <View style={styles.heroCard}>
            <View style={styles.moneyCircle}>
              <Text style={{ fontSize: 30 }}>💰</Text>
            </View>
            <View>
              <Text style={styles.heroCardTitle}>Smart Dashboard</Text>
              <Text style={styles.heroCardSub}>AI insights at a glance</Text>
            </View>
            <View style={styles.pillOk}>
              <View style={styles.pip} />
              <Text style={styles.pillOkText}>On track</Text>
            </View>
          </View>
        </View>

        {/* Features (horizontal) */}
        <Section title="Why FinGuard?">
          <FlatList
            data={FEATURES}
            horizontal
            keyExtractor={(item, i) => item.title + i}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <FeatureCard
                title={item.title}
                text={item.text}
                iconSet={item.iconSet}
                iconName={item.icon}
                tag={item.tag}
                tagBg={item.tagBg}
              />
            )}
          />
        </Section>

        {/* Stats (2 columns) */}
        <Section>
          <View style={styles.statsWrap}>
            {STATS.map((s, i) => (
              <View style={styles.statCard} key={i}>
                <Text style={styles.statNumber}>{s.number}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Testimonials (horizontal) */}
        <Section title="What Our Users Say" subtitle="Real stories from Sri Lanka">
          <FlatList
            data={TESTIMONIALS}
            horizontal
            keyExtractor={(item, i) => item.name + i}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <TestimonialCard {...item} />}
          />
        </Section>

        {/* Pricing (compact cards) */}
        <Section title="Simple Plans, Big Results">
          <PricingRow router={router} />
        </Section>

        {/* Spacer for floating CTA */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Floating CTA */}
      <View style={styles.fabWrap}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={goRegister}
        >
          <Feather name="arrow-right-circle" size={18} color={BG_DARK} />
          <Text style={styles.fabText}>Start Free</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

/* ---------------- Reusable bits ---------------- */

const Section = ({ title, subtitle, children }) => {
  const styles = useMemo(() => createStyles(), []);
  return (
    <View style={styles.section}>
      {!!title && <Text style={styles.sectionTitle}>{title}</Text>}
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
};

const PrimaryButton = ({ label, onPress }) => {
  const styles = useMemo(() => createStyles(), []);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
      android_ripple={{ color: GREEN + "22" }}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
};

const GhostButton = ({ label, onPress }) => {
  const styles = useMemo(() => createStyles(), []);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]} >
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
};

const FeatureCard = ({ title, text, iconSet = Feather, iconName = "star", iconColor = GREEN, iconSize = 34, tag, tagBg }) => {
  const styles = useMemo(() => createStyles(), []);
  const IconComp = iconSet;

  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconWrap}>
        <IconComp name={iconName} size={iconSize} color={iconColor} />
        {!!tag && <View style={[styles.smallBadge, { backgroundColor: tagBg }]}><Text style={{ fontWeight: "700" }}>{tag}</Text></View>}
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
};

const TestimonialCard = ({ name, role, text }) => {
  const styles = useMemo(() => createStyles(), []);
  return (
    <View style={styles.testimonialCard}>
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Text key={i} style={{ fontSize: 14, marginRight: 2 }}>⭐</Text>
        ))}
      </View>
      <Text style={styles.testimonialText}>"{text}"</Text>
      <View style={styles.testimonialUser}>
        <View style={styles.avatarCircle}>
          <Text style={{ color: TEXT, fontWeight: "700" }}>{name.charAt(0)}</Text>
        </View>
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userRole}>{role}</Text>
        </View>
      </View>
    </View>
  );
};

const PricingRow = ({ router }) => {
  const styles = useMemo(() => createStyles(), []);
  const goRegister = () => router.push("/(auth)/register");

  return (
    <View style={styles.pricingRow}>
      <PricingCard
        title="Free"
        price="LKR 0"
        color={GREEN}
        features={["Basic budgeting", "Expense tracking", "Standard alerts", "Basic debt tracking"]}
        onPress={goRegister}
        cta="Get Started Free"
        borderColor="#334155"
      />
      <PricingCard
        title="Premium"
        price="LKR 2,999/mo"
        color="#3B82F6"
        features={["Everything in Free", "AI recommendations", "Priority support", "Hyper-local insights", "Debt optimization tools", "Advanced analytics"]}
        onPress={() => router.push("/subscription/plans")}
        cta="View Plans & Pricing"
        badge="🔥 Most Popular"
        gradient
      />
      <PricingCard
        title="Family"
        price="LKR 4,999/mo"
        color="#8B5CF6"
        features={["Everything in Premium", "Up to 5 family members", "Family dashboard", "Parent controls", "Shared budgets", "Combined reporting"]}
        onPress={() => router.push("/subscription/plans")}
        cta="Choose Family Plan"
        gradient
      />
    </View>
  );
};

const PricingCard = ({ title, price, color, features, onPress, cta, gradient, badge, borderColor }) => {
  const styles = useMemo(() => createStyles(), []);
  return (
    <View style={[styles.priceCard, { borderColor: borderColor || "#374151" }, gradient && { backgroundColor: CARD_DARK }]}>
      {!!badge && <View style={styles.badgeFloat}><Text style={styles.badgeFloatText}>{badge}</Text></View>}
      <Text style={styles.priceTitle}>{title}</Text>
      <Text style={[styles.priceValue, { color }]}>{price}</Text>
      <Text style={styles.priceSubtitle}>
        {title === "Free" ? "Perfect to get started" : title === "Family" ? "Complete family solution" : "AI-powered financial growth"}
      </Text>
      <View style={{ marginVertical: 12 }}>
        {features.map((f, i) => (
          <View style={styles.featureRow} key={i}>
            <Feather name="check-circle" size={16} color={color} />
            <Text style={styles.featureRowText}>{f}</Text>
          </View>
        ))}
      </View>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.priceBtn, { backgroundColor: color }, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]} >
        <Text style={styles.priceBtnText}>{cta}</Text>
      </Pressable>
      {title === "Premium" && <Text style={styles.trialNote}>14-day free trial • Cancel anytime</Text>}
    </View>
  );
};

/* ---------------- Styles ---------------- */
function createStyles() {
  const CARD_W = width * 0.78;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG_DARK},
    header: {
      backgroundColor: "#12122a",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: BORDER,
      paddingTop: Platform.OS === "ios" ? 8 : 0,
      paddingHorizontal: 16,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logo: { color: GREEN, fontSize: 22, fontWeight: "800" },
    helpBtn: {
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: "#1f2430",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "#2B2F36",
    },
    helpText: { color: TEXT, fontWeight: "600", fontSize: 12 },
    scrollContent: { paddingBottom: 24 },
    hero: { paddingHorizontal: 16, paddingTop: 18 },
    kicker: {
      alignSelf: "flex-start",
      color: "#C7F9D3",
      backgroundColor: "rgba(74,222,128,0.12)",
      borderColor: GREEN + "55",
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 10,
    },
    title: { color: TEXT, fontSize: 30, fontWeight: "900", lineHeight: 34 },
    titleAccent: { color: GREEN },
    subtitle: { color: MUTED, marginTop: 10, lineHeight: 22, fontSize: 14.5, marginRight: 4 },
    ctaRow: { marginTop: 16, gap: 10 },
    primaryBtn: {
      backgroundColor: GREEN, paddingVertical: 14, borderRadius: 14, alignItems: "center",
      shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 7, elevation: 6,
    },
    primaryBtnText: { color: BG_DARK, fontWeight: "800" },
    secondaryBtn: { borderWidth: 2, borderColor: GREEN, paddingVertical: 12, borderRadius: 14, alignItems: "center", backgroundColor: "transparent" },
    secondaryBtnText: { color: GREEN, fontWeight: "700" },
    heroCard: {
      marginTop: 16, backgroundColor: "#121e25", borderColor: "#20323e", borderWidth: 1,
      borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
    },
    moneyCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },
    heroCardTitle: { color: "#C7F9D3", fontWeight: "800", fontSize: 16 },
    heroCardSub: { color: "#B7D9C2", fontSize: 12 },
    pillOk: {
      marginLeft: "auto", backgroundColor: "rgba(74,222,128,0.14)", borderColor: GREEN + "66",
      borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6,
    },
    pip: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
    pillOkText: { color: "#D1FADF", fontWeight: "700", fontSize: 12 },
    section: { paddingTop: 22 },
    sectionTitle: { color: TEXT, fontSize: 20, fontWeight: "800", paddingHorizontal: 16, marginBottom: 6 },
    sectionSubtitle: { color: MUTED, fontSize: 13, paddingHorizontal: 16, marginBottom: 10 },
    featureCard: { width: CARD_W, backgroundColor: CARD_DARK, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 16 },
    featureIconWrap: {
      width: 72, height: 72, borderRadius: 16, backgroundColor: "rgba(74,222,128,0.15)",
      alignItems: "center", justifyContent: "center", alignSelf: "flex-start", marginBottom: 8,
    },
    smallBadge: { position: "absolute", top: -6, right: -6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
    featureTitle: { color: TEXT, fontWeight: "800", fontSize: 18, marginTop: 4 },
    featureText: { color: MUTED, marginTop: 4, fontSize: 13, lineHeight: 18 },
    statsWrap: { paddingHorizontal: 16, marginTop: 4, flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
    statCard: {
      width: (Dimensions.get("window").width - 16 * 2 - 10) / 2,
      backgroundColor: CARD_DARK, borderColor: BORDER, borderWidth: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 12, alignItems: "center",
    },
    statNumber: { color: GREEN, fontSize: 20, fontWeight: "900" },
    statLabel: { color: "#D1D5DB", marginTop: 6, fontSize: 12, textAlign: "center" },
    testimonialCard: { width: CARD_W, backgroundColor: CARD_DARK, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 16 },
    testimonialText: { color: "#E5E7EB", fontStyle: "italic", marginBottom: 10 },
    testimonialUser: { flexDirection: "row", alignItems: "center" },
    avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: GREEN_DARK, alignItems: "center", justifyContent: "center" },
    userName: { color: TEXT, fontWeight: "700" },
    userRole: { color: MUTED, fontSize: 12 },
    pricingRow: { paddingHorizontal: 16, gap: 12 },
    priceCard: { width: "100%", backgroundColor: CARD_DARK, borderWidth: 2, borderColor: "#374151", borderRadius: 18, padding: 16, marginBottom: 12 },
    badgeFloat: { position: "absolute", top: -12, alignSelf: "center", backgroundColor: "#3B82F6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
    badgeFloatText: { color: "#fff", fontWeight: "800", fontSize: 12 },
    priceTitle: { color: TEXT, fontWeight: "800", fontSize: 18, textAlign: "center", marginTop: 6 },
    priceValue: { fontWeight: "900", fontSize: 22, textAlign: "center", marginTop: 4 },
    priceSubtitle: { color: MUTED, textAlign: "center", marginTop: 4, marginBottom: 10, fontSize: 12 },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    featureRowText: { color: "#E5E7EB", fontSize: 13, flex: 1 },
    priceBtn: { marginTop: 10, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
    priceBtnText: { color: BG_DARK, fontWeight: "800" },
    trialNote: { color: MUTED, textAlign: "center", fontSize: 11, marginTop: 6 },
    fabWrap: { position: "absolute", left: 0, right: 0, bottom: 12, alignItems: "center" },
    fab: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: GREEN, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 999,
      shadowColor: GREEN, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8,
    },
    fabText: { color: BG_DARK, fontWeight: "900", fontSize: 15 },
  });
}

export default App;
