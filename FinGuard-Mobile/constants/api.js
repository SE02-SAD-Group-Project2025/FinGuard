import { Platform } from "react-native";

const guessBase = () => {
  // iOS simulator can use localhost; Android emulator must use 10.0.2.2
  if (Platform.OS === "android") return "http://10.0.2.2:4000";
  return "http://localhost:4000";
};

// If you prefer hardcoding your LAN IP for real devices, change here:
export const API_BASE = guessBase();

export const endpoints = {
  login: `${API_BASE}/api/auth/login`,
  register: `${API_BASE}/api/auth/register`,
};
