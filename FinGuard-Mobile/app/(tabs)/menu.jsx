import React, { useMemo } from "react";
import {
  View,
  Text,
  Appearance,
  Platform,
  SafeAreaView,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { MENU_ITEMS } from "@/constants/MenuItems";
import { useAuth } from "@/contexts/AuthContext";

const Menu = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const colorScheme = Appearance.getColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = useMemo(() => createStyles(theme, colorScheme), [theme, colorScheme]);
  const Container = Platform.OS === "web" ? ScrollView : SafeAreaView;
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#000000";

  const doSignOut = async () => {
    try {
      await signOut();
      // If your signOut already redirects (it does in the AuthContext example),
      // this will be a no-op. But keep fallback just in case.
      router.replace("/(auth)/login");
    } catch (e) {
      console.error("Logout failed", e);
      if (Platform.OS === "web") {
        window.alert("Logout failed. Please try again.");
      } else {
        Alert.alert("Logout failed", e?.message || "Please try again");
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      // simple confirmation for web
      const ok = window.confirm("Are you sure you want to logout?");
      if (ok) doSignOut();
      return;
    }

    // native platforms show an Alert modal
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          doSignOut();
        },
      },
    ]);
  };

  // Safely compute display fields from user
  const displayName = user?.username || user?.email || "User";
  const subtitle = user?.username && user?.email ? user.email : undefined;

  const Header = () => (
    <View style={styles.headerCard}>
      <View style={styles.avatarWrap}>
        <Image
          source={{
            uri:
              user?.avatarUrl ||
              "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
          }}
          style={styles.avatar}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.msisdn}>{displayName}</Text>
        {subtitle ? <Text style={styles.subtle}>{subtitle}</Text> : null}
        <Pressable onPress={() => router.push("/profile")}>
          <Text style={styles.viewProfile}>View Profile</Text>
        </Pressable>
      </View>

      <Pressable hitSlop={10} onPress={() => router.back?.() || router.push("/(tabs)/dashboard")}>
        <Feather name="x" size={22} color={iconColor} />
      </Pressable>
    </View>
  );

  const Footer = () => (
    <View style={styles.footer}>
      <Text style={styles.version}>App Version: v1.1.0</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <Pressable
      onPress={item.danger ? handleLogout : () => router.push(item.route)}
      android_ripple={{ color: theme.tint + "22" }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.left}>
        <View style={[styles.iconPill, item.danger && styles.iconPillDanger]}>
          <Feather name={item.icon} size={18} color={item.danger ? "#ef4444" : "#4ADE80"} />
        </View>
        <Text style={[styles.title, item.danger && styles.titleDanger]}>{item.title}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={iconColor} />
    </Pressable>
  );

  return (
    <Container style={styles.container}>
      <FlatList
        ListHeaderComponent={<Header />}
        data={MENU_ITEMS}
        keyExtractor={(item, idx) => item.route || String(idx)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<Footer />}
      />
    </Container>
  );
};

function createStyles(theme, scheme) {
  const green = "#4ADE80";
  const greenSoft = "rgba(74, 222, 128, 0.12)";
  const red = "#ef4444";
  const redSoft = "rgba(239, 68, 68, 0.12)";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingTop: 20 },
    listContent: { paddingHorizontal: 16, paddingBottom: 28 },

    headerCard: {
      marginTop: 10,
      backgroundColor: theme.card,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 18,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "ios" ? 24 : 16,
      paddingBottom: 20,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      shadowColor: "#000",
      shadowOpacity: scheme === "dark" ? 0.25 : 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    avatarWrap: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 4,
    },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    msisdn: { color: theme.text, fontSize: 18, fontWeight: "700" },
    subtle: { color: theme.textSecondary ?? "#C9C9C9", marginTop: 2, fontSize: 12 },
    viewProfile: { color: "#FFFFFF", marginTop: 6, fontSize: 13 },

    row: {
      backgroundColor: theme.surface ?? theme.card,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowPressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
    left: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconPill: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: greenSoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: green + "55",
    },
    iconPillDanger: { backgroundColor: redSoft, borderColor: red + "55" },
    title: { fontSize: 16, color: theme.textSecondary ?? "#C9C9C9", fontWeight: "600" },
    titleDanger: { color: red },
    separator: { height: 10 },

    footer: { alignItems: "center", marginTop: 18 },
    version: { color: "#FFFFFF", fontSize: 12 },
  });
}

export default Menu;
