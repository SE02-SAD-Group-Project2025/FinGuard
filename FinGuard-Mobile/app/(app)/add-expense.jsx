import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

const PRESET_CATEGORIES = [
  "Food & Dining", "Groceries", "Transportation", "Entertainment", "Utilities",
  "Shopping", "Healthcare", "Education", "Travel", "Rent", "Insurance",
  "Phone & Internet", "Fuel", "Clothing", "Personal Care", "Home Maintenance",
  "Subscriptions", "Other Expenses",
];

export default function AddExpense() {
  const router = useRouter();
  const { token } = useAuth();

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!category || !amount || !date) {
      Alert.alert("Missing info", "Please fill in category, amount and date.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: "expense",
          category,
          amount: parseFloat(amount),
          date,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add expense");

      Alert.alert("Success", "Expense added!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.wrap}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Add Expense</Text>
        <Text style={s.sub}>Record a new expense</Text>

        <Text style={s.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {PRESET_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              style={[s.chip, category === c && s.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[s.chipTxt, category === c && s.chipTxtActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput
          placeholder="Or type a custom category"
          placeholderTextColor="#8b90a6"
          value={category}
          onChangeText={setCategory}
          style={s.input}
        />

        <Text style={s.label}>Amount (LKR)</Text>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor="#8b90a6"
          style={s.input}
        />

        <Text style={s.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#8b90a6"
          style={s.input}
        />

        <Text style={s.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional note"
          placeholderTextColor="#8b90a6"
          style={[s.input, { height: 90, textAlignVertical: "top" }]}
          multiline
        />

        <Pressable
          style={({ pressed }) => [s.btn, pressed && { opacity: 0.9 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          <Text style={s.btnTxt}>{loading ? "Saving..." : "Add Expense"}</Text>
        </Pressable>

        <Pressable style={s.linkBtn} onPress={() => router.back()}>
          <Text style={s.linkTxt}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f0f23" },
  container: { padding: 20, paddingBottom: 40 },
  title: { color: "#fff", fontSize: 24, fontWeight: "900" },
  sub: { color: "#a0a0b0", marginTop: 4, marginBottom: 16 },
  label: { color: "#c9cfd6", marginTop: 14, marginBottom: 8, fontWeight: "700" },
  input: {
    backgroundColor: "#101522",
    borderColor: "#20263a",
    borderWidth: 1,
    borderRadius: 12,
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chipRow: { gap: 8, paddingVertical: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0f1322",
  },
  chipActive: { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "#ef4444" },
  chipTxt: { color: "#c9cfd6", fontSize: 12, fontWeight: "700" },
  chipTxtActive: { color: "#ef4444" },
  btn: {
    marginTop: 20,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnTxt: { color: "#0f0f23", fontWeight: "900" },
  linkBtn: { alignItems: "center", marginTop: 10 },
  linkTxt: { color: "#a0a0b0", fontWeight: "700" },
});
