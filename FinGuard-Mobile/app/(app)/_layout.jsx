import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function AppLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f0f23" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          title: "", // default empty; each screen sets its own title below
        }}
      >
        <Stack.Screen
          name="add-expense"
          options={{
            title: "Expenses",
          }}
        />
        <Stack.Screen
          name="add-income"
          options={{
            title: "Incomes",
          }}
        />
      </Stack>
    
    </>
  )
}