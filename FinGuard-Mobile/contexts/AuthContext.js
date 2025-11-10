import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Load token & user once on startup
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem("finguard-token");
        const storedUser = await AsyncStorage.getItem("finguard-user");
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (e) {
        console.warn("Auth bootstrap failed:", e);
        setToken(null);
        setUser(null);
      } finally {
        setBootstrapped(true);
      }
    })();
  }, []);

  const signIn = async ({ token: newToken, user: newUser }) => {
    try {
      setToken(newToken);
      setUser(newUser || null);
      await AsyncStorage.setItem("finguard-token", newToken);
      if (newUser) {
        await AsyncStorage.setItem("finguard-user", JSON.stringify(newUser));
      } else {
        await AsyncStorage.removeItem("finguard-user");
      }
    } catch (e) {
      console.error("Auth signIn failed:", e);
      // reset on failure
      setToken(null);
      setUser(null);
    }
  };

  const signOut = async () => {
    try {
      setToken(null);
      setUser(null);
      await AsyncStorage.multiRemove(["finguard-token", "finguard-user"]);
    } catch (e) {
      console.error("Auth signOut failed:", e);
    } finally {
      // Adjust path if your login screen is in (public)
      router.replace("/(public)/login");
    }
  };

  const value = useMemo(
    () => ({
      bootstrapped,
      token,
      user,
      isAuthenticated: !!token,
      signIn,
      signOut,
    }),
    [bootstrapped, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
