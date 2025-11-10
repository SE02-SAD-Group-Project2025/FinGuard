import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { register as apiRegister } from "@/lib/authApi";
import { Link, useRouter } from "expo-router";

const GREEN = "#4ADE80";
const BG = "#0f0f23";
const CARD = "#17172b";
const TEXT = "#FFFFFF";
const MUTED = "#C9CFD6";
const BORDER = "#2a2a3e";

const styles = StyleSheet.create({
  // Make the top spacing and padding consistent with the login screen
  scrollContent: {
    flexGrow: 1,
    padding: 20,           // match login container padding
    paddingTop: 12,        // small top offset so brand sits like login
    backgroundColor: BG,
    justifyContent: "flex-start", // start at top (not vertically centered)
  },

  brand: { color: GREEN, fontWeight: "900", fontSize: 24, marginTop: 8 },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 18,         // same as login card margin
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
  input: { flex: 1, color: TEXT },
  btn: {
    marginTop: 16,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnTxt: { color: "#0f0f23", fontWeight: "800" },
  secondary: { paddingVertical: 12, alignItems: "center", marginTop: 8 },
  secondaryTxt: { color: MUTED, fontWeight: "600" },
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

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const next = () => {
    setErr("");
    if (!email.includes("@")) return setErr("Valid email is required");
    if (!username || username.length < 3) return setErr("Username must be at least 3 chars");
    if (!password || password.length < 6) return setErr("Password min 6 chars");
    if (password !== confirm) return setErr("Passwords do not match");
    setStep(2);
  };

  const submit = async () => {
    setErr("");
    if (!fullName) return setErr("Full name is required");
    setLoading(true);
    try {
      await apiRegister({
        email: email.trim(),
        username: username.trim(),
        password,
        full_name: fullName,
        dob: dob || null,
      });
      router.replace("/(auth)/login");
    } catch (e) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.brand}>FinGuard</Text>

          <View style={styles.card}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.sub}>It only takes a minute</Text>

            {!!err && (
              <View style={styles.error}>
                <Feather name="alert-triangle" size={16} color="#FCA5A5" />
                <Text style={styles.errorTxt}>{err}</Text>
              </View>
            )}

            {step === 1 ? (
              <>
                <Field icon="user">
                  <TextInput
                    placeholder="Username"
                    placeholderTextColor={MUTED}
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </Field>

                <Field icon="mail">
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={MUTED}
                    style={styles.input}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </Field>

                <Field icon="lock">
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={MUTED}
                    style={styles.input}
                    secureTextEntry={!showPwd}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="next"
                  />
                  <Pressable onPress={() => setShowPwd(v => !v)}>
                    <Feather name={showPwd ? "eye-off" : "eye"} size={18} color={MUTED} />
                  </Pressable>
                </Field>

                <Field icon="lock">
                  <TextInput
                    placeholder="Confirm password"
                    placeholderTextColor={MUTED}
                    style={styles.input}
                    secureTextEntry={!showConfirm}
                    value={confirm}
                    onChangeText={setConfirm}
                    onSubmitEditing={next}
                    returnKeyType="done"
                  />
                  <Pressable onPress={() => setShowConfirm(v => !v)}>
                    <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={MUTED} />
                  </Pressable>
                </Field>

                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
                  onPress={next}
                >
                  <Text style={styles.btnTxt}>Next</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Field icon="user">
                  <TextInput
                    placeholder="Full name"
                    placeholderTextColor={MUTED}
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    returnKeyType="next"
                  />
                </Field>

                <Field icon="calendar">
                  <TextInput
                    placeholder="Date of birth (YYYY-MM-DD)"
                    placeholderTextColor={MUTED}
                    style={styles.input}
                    value={dob}
                    onChangeText={setDob}
                    returnKeyType="done"
                  />
                </Field>

                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
                  onPress={submit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#0f0f23" />
                  ) : (
                    <Text style={styles.btnTxt}>Create Account</Text>
                  )}
                </Pressable>

                <Pressable style={styles.secondary} onPress={() => setStep(1)}>
                  <Text style={styles.secondaryTxt}>← Back</Text>
                </Pressable>
              </>
            )}

            <View style={styles.footerRow}>
              <Text style={{ color: MUTED }}>Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <Pressable><Text style={styles.link}> Sign in</Text></Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Field = ({ icon, children }) => (
  <View style={styles.field}>
    <Feather name={icon} size={18} color={MUTED} />
    {children}
  </View>
);
