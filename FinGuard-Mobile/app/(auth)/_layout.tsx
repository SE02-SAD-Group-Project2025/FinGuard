// app/(auth)/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { StatusBar, Platform } from "react-native";

export default function AuthLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f0f23" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          // Remove the ugly group name default:
          title: "", // default empty; each screen sets its own title below
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: "Login",
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: "Register",
          }}
        />
      </Stack>
    </>
  );
}
