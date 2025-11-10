import React from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";

function AuthGate({ children }) {
  const { bootstrapped, token } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (!bootstrapped) return;

    const inTabs = segments[0] === "(tabs)";
    const inPublic = segments[0] === "(public)";
    const inAuth = segments[0] === "(auth)";

    if (!token) {
      if (inTabs) {
        router.replace("/(auth)/login");
      }
    } else {
      if (inPublic || inAuth) {
        router.replace("/(tabs)/dashboard");
      }
    }
  }, [bootstrapped, token, segments]);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthGate>
    </AuthProvider>
  );
}