// app/(app)/add-income.js
import React, { useState } from "react";
import {
  View, Text, SafeAreaView, StyleSheet, TextInput,
  Pressable, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const PRESET_CATEGORIES = [
  "Salary","Freelance","Business Income","Investment Returns","Rental Income",
  "Bonus","Commission","Side Hustle","Gift Money","Refund","Other Income",
];

// Use the same base everywhere in the app
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://10.91.73.120:4000/api";

// Normalize token to always be "Bearer <jwt>"
const makeAuthHeader = (token) => {
  if (!token) return undefined;
  const t = String(token).trim();
  return t.toLowerCase().startsWith("bearer ") ? t : `Bearer ${t}`;
};

export default function AddIncome() {
  const router = useRouter();
  const { token } = useAuth();

  const [category, setCategory]   = useState("");
  const [amount, setAmount]       = useState("");
  const [date, setDate]           = useState(new Date().toISOString().split("T")[0]);
  const [description, setDesc]    = useState("");
  const [loading, setLoading]     = useState(false);

  async function onSubmit() {
    if (!category || !amount || !date) {
      Alert.alert("Missing info", "Please fill in category, amount and date.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: makeAuthHeader(token) } : {}),
        },
        body: JSON.stringify({
          type: "income",
          category,
          amount: parseFloat(amount),
          date,
          description,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // show reason from server (helps if JWT fails)
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      Alert.alert("Success", "Income added!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to add income");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.wrap}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Add Income</Text>
        <Text style={s.sub}>Track a new earning</Text>

        <Text style={s.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {PRESET_CATEGORIES.map((c) => (
            <Pressable key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
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
          onChangeText={setDesc}
          placeholder="Optional note"
          placeholderTextColor="#8b90a6"
          style={[s.input, { height: 90, textAlignVertical: "top" }]}
          multiline
        />

        <Pressable style={({ pressed }) => [s.btn, pressed && { opacity: 0.9 }]} onPress={onSubmit} disabled={loading}>
          <Text style={s.btnTxt}>{loading ? "Saving..." : "Add Income"}</Text>
        </Pressable>

        <Pressable style={s.linkBtn} onPress={() => router.back()}>
          <Text style={s.linkTxt}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap:{ flex:1, backgroundColor:"#0f0f23" },
  container:{ padding:20, paddingBottom:40 },
  title:{ color:"#fff", fontSize:24, fontWeight:"900" },
  sub:{ color:"#a0a0b0", marginTop:4, marginBottom:16 },
  label:{ color:"#c9cfd6", marginTop:14, marginBottom:8, fontWeight:"700" },
  input:{
    backgroundColor:"#101522", borderColor:"#20263a", borderWidth:1,
    borderRadius:12, color:"#fff", paddingHorizontal:12, paddingVertical:12,
  },
  chipRow:{ gap:8, paddingVertical:8 },
  chip:{
    borderRadius:999, borderWidth:1, borderColor:"#2a2a3e",
    paddingHorizontal:12, paddingVertical:8, backgroundColor:"#0f1322",
  },
  chipActive:{ backgroundColor:"rgba(16,185,129,0.15)", borderColor:"#10b981" },
  chipTxt:{ color:"#c9cfd6", fontSize:12, fontWeight:"700" },
  chipTxtActive:{ color:"#10b981" },
  btn:{ marginTop:20, backgroundColor:"#10b981", borderRadius:12, paddingVertical:14, alignItems:"center" },
  btnTxt:{ color:"#0f0f23", fontWeight:"900" },
  linkBtn:{ alignItems:"center", marginTop:10 },
  linkTxt:{ color:"#a0a0b0", fontWeight:"700" },
});
