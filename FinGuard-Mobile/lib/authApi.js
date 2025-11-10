// lib/authApi.js
import { Platform } from "react-native";

/**
 * BASE URL RESOLUTION - UPDATED FOR LOCAL NETWORK
 * - Use EXPO_PUBLIC_API_URL when provided
 * - Fallback to local network IP for better mobile development
 */
const determineApiBase = () => {
  // Get environment variable
  const rawEnv = (process.env.EXPO_PUBLIC_API_URL || "").trim();
  
  // If environment variable is provided, use it
  if (rawEnv) {
    const cleanEnv = rawEnv.replace(/\/+$/, "");
    return /\/api$/.test(cleanEnv) ? cleanEnv : `${cleanEnv}/api`;
  }

  // UPDATED: Use your local network IP for all platforms
  // This works for both physical devices and emulators on the same network
  const LOCAL_NETWORK_IP = "10.91.73.120"; // Your computer's IP
  const PORT = 4000;
  
  return `http://${LOCAL_NETWORK_IP}:${PORT}/api`;
  
  // Old platform-specific logic (commented out):
  // if (Platform.OS === "android") {
  //   return "http://10.0.2.2:4000/api"; // Android emulator only
  // } else if (Platform.OS === "ios") {
  //   return "http://localhost:4000/api"; // iOS simulator only
  // } else {
  //   return "http://localhost:4000/api"; // Web
  // }
};

const API_BASE = determineApiBase();

export const API_URL = API_BASE;

export function getApiBaseUrl() {
  return API_BASE;
}

function jsonHeaders(extra = {}) {
  return { 
    Accept: "application/json", 
    "Content-Type": "application/json", 
    ...extra 
  };
}

/**
 * Enhanced request helper with better error handling and debugging
 */
async function request(
  path,
  { method = "GET", headers = {}, body, timeout = 15000, token } = {}
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const url = `${API_BASE}${path}`;

  // Debug logging
  if (__DEV__) {
    console.log(`[API Request] ${method} ${url}`, {
      headers: { ...jsonHeaders(), ...headers },
      body
    });
  }

  try {
    const res = await fetch(url, {
      method,
      headers: jsonHeaders({
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      }),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.warn(`[API] Failed to parse JSON from ${url}:`, text);
      data = { raw: text, error: "Invalid JSON response" };
    }

    if (!res.ok) {
      const msg = data?.error || data?.message || data?.raw || `Request failed (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      err.url = url;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      const timeoutError = new Error("Request timed out. Please check your connection and try again.");
      timeoutError.isTimeout = true;
      timeoutError.url = url;
      throw timeoutError;
    }
    
    if (String(err.message).includes("Network request failed")) {
      const networkError = new Error(
        `Cannot connect to server. Please check:\n` +
        `1. Your backend is running on port 4000\n` +
        `2. API URL: ${API_BASE}\n` +
        `3. Your network connection\n` +
        `4. Windows Firewall allows port 4000`
      );
      networkError.isNetworkError = true;
      networkError.url = url;
      throw networkError;
    }
    
    // Re-throw with additional context
    err.url = url;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Test connection to the API server
 * Useful for debugging connection issues
 */
export async function testConnection() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timer);
    
    if (response.ok) {
      return { 
        success: true, 
        message: 'Connected successfully',
        status: response.status 
      };
    } else {
      return { 
        success: false, 
        message: `Server responded with status: ${response.status}`,
        status: response.status 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error.message,
      error: error.name,
      isTimeout: error.name === 'AbortError',
      isNetworkError: error.message.includes('Network request failed')
    };
  }
}

/**
 * Get detailed connection info for debugging
 */
export function getConnectionInfo() {
  return {
    apiBase: API_BASE,
    platform: Platform.OS,
    isDev: __DEV__,
    envVar: process.env.EXPO_PUBLIC_API_URL,
    timestamp: new Date().toISOString()
  };
}

/* ---------- Public API ---------- */

export function ping() {
  return request("/health");
}

export function register(payload) {
  // payload: { email, username, password, full_name?, dob? }
  return request("/auth/register", { 
    method: "POST", 
    body: payload,
    timeout: 20000 // Longer timeout for registration
  });
}

export function login({ email, password }) {
  return request("/auth/login", { 
    method: "POST", 
    body: { email, password },
    timeout: 15000 
  });
}

/* ---------- Dashboard helpers ---------- */

export function getSummary({ month, year, token }) {
  const q = `?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`;
  return request(`/summary${q}`, { token });
}

export function getTransactions({ token }) {
  return request(`/transactions`, { token });
}

/* ---------- User management ---------- */

export function getProfile({ token }) {
  return request("/auth/profile", { token });
}

export function updateProfile({ token, updates }) {
  return request("/auth/profile", { 
    method: "PUT", 
    body: updates, 
    token 
  });
}

/* ---------- Debug utilities ---------- */

// Export a function to manually set API base (for testing)
let customApiBase = null;
export function setCustomApiBase(url) {
  customApiBase = url;
}

export function getCurrentApiBase() {
  return customApiBase || API_BASE;
}

// Debug function to test various endpoints
export async function runDiagnostics() {
  const results = [];
  
  try {
    // Test basic connection
    const connectionTest = await testConnection();
    results.push({ test: 'Connection', ...connectionTest });
    
    // Test if backend is responsive
    const health = await ping().catch(error => ({ error: error.message }));
    results.push({ test: 'Health endpoint', response: health });
    
    return results;
  } catch (error) {
    results.push({ test: 'Diagnostics', error: error.message });
    return results;
  }
}

/* Dev log with more detailed information */
if (__DEV__) {
  console.log("[authApi] Configuration:", {
    API_BASE: API_BASE,
    Platform: Platform.OS,
    "EXPO_PUBLIC_API_URL": process.env.EXPO_PUBLIC_API_URL || "Not set",
    "Is Development": __DEV__,
    "Using Local Network IP": "10.91.73.120"
  });
  
  // Auto-test connection in dev mode
  setTimeout(async () => {
    try {
      const connection = await testConnection();
      console.log("[authApi] Connection test:", connection);
    } catch (error) {
      console.warn("[authApi] Connection test failed:", error.message);
    }
  }, 1000);
}

export default {
  API_URL,
  getApiBaseUrl,
  testConnection,
  getConnectionInfo,
  ping,
  register,
  login,
  getSummary,
  getTransactions,
  getProfile,
  updateProfile,
  setCustomApiBase,
  getCurrentApiBase,
  runDiagnostics
};