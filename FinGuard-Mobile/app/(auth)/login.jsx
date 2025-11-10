import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
// Note: Dependencies like @expo/vector-icons, expo-router, and custom contexts 
// are typically part of a full Expo/React Native environment.
// For display/preview purposes, we assume these are conceptually available:
import { useAuth } from "@/contexts/AuthContext";
import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
// FIX: Import the 'login' function from authApi and rename it using an alias 'as apiLogin'
import { login as apiLogin } from "@/lib/authApi";

// Mocked implementations for Preview/Display purposes
// const Feather = { name: (n) => <Text style={{ color: MUTED }}>[{n} icon]</Text> };
// const Link = ({ children, href }) => <View>{children}</View>;
// const useRouter = () => ({ replace: (path) => console.log(`Navigating to ${path}`) });
// const useAuth = () => ({ signIn: async (data) => console.log("Signing in", data) });
// const apiLogin = async ({ email, password }) => {
//   console.log(`Attempting login for: ${email}`);
//   // Mock API call response for success
//   if (email === "test@example.com" && password === "password") {
//     return { token: "mock-token-123", user: { id: 1, email } };
//   }
//   // Mock API call response for failure
//   throw new Error("Invalid email or password provided.");
// };


const GREEN = "#4ADE80";
const BG = "#0f0f23";
const CARD = "#17172b";
const TEXT = "#FFFFFF";
const MUTED = "#C9CFD6";
const BORDER = "#2a2a3e";
const isWeb = Platform.OS === "web";

/** On web, don't consume pointer events or you'll block focusing inputs. */
const DismissKeyboard = ({ children }) => {
  if (isWeb) {
    return <View style={{ flex: 1 }}>{children}</View>;
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: BG},
  brand: { color: GREEN, fontWeight: "900", fontSize: 24, marginTop: 5},
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  title: { color: TEXT, fontSize: 22, fontWeight: "800" },
  sub: { color: MUTED, marginTop: 4, marginBottom: 12 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#101522",
    borderColor: "#20263a",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  input: {
    flex: 1,
    color: TEXT,
    /* Web-only niceties */
    ...(isWeb
      ? {
          outlineStyle: "none",
          // Ensure the input can receive focus properly
          cursor: "text",
        }
      : null),
  },
  btn: {
    marginTop: 16,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnTxt: { color: BG, fontWeight: "800" },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  link: { color: GREEN, fontWeight: "700" },
  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "#7F1D1D",
    borderWidth: 1,
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  errorTxt: { color: "#FCA5A5", flex: 1 },
});

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit() {
    setErr("");

    if (!email || !password) {
      setErr("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      // apiLogin is now defined because it's imported as an alias for the 'login' function
      const data = await apiLogin({ email: email.trim(), password });
      await signIn({ token: data.token, user: data.user });
      router.replace("/(tabs)/dashboard");
    } catch (e) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <DismissKeyboard>
          <View style={s.container}>
            <Text style={s.brand}>FinGuard</Text>

            <View style={s.card}>
              <Text style={s.title}>Welcome back</Text>
              <Text style={s.sub}>Sign in to continue</Text>

              {!!err && (
                <View style={s.error}>
                  <Feather name="alert-triangle" size={16} color="#FCA5A5" />
                  <Text style={s.errorTxt}>{err}</Text>
                </View>
              )}

              <View style={s.field}>
                <Feather name="mail" size={18} color={MUTED} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={MUTED}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                  autoCorrect={false}
                  autoComplete="email"
                  enterKeyHint="next"
                  // Web: let the input keep focus
                  onSubmitEditing={() => {
                    // move focus to password on mobile; on web user can tab naturally
                  }}
                />
              </View>

              <View style={s.field}>
                <Feather name="lock" size={18} color={MUTED} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={MUTED}
                  secureTextEntry={!show}
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="password"
                  textContentType="password"
                  enterKeyHint="done"
                  onSubmitEditing={onSubmit}
                />
                <Pressable onPress={() => setShow((v) => !v)}>
                  <Feather name={show ? "eye-off" : "eye"} size={18} color={MUTED} />
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [s.btn, pressed && { opacity: 0.9 }]}
                onPress={onSubmit}
                android_ripple={{ color: GREEN + "22" }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={BG} />
                ) : (
                  <Text style={s.btnTxt}>Sign In</Text>
                )}
              </Pressable>

              <View style={s.footerRow}>
                <Text style={{ color: "#C9CFD6" }}>No account?</Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable>
                    <Text style={s.link}> Create one</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </DismissKeyboard>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}