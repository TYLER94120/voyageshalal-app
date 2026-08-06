import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Couleurs } from "@/constants/couleurs";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Couleurs.nuit },
          headerTintColor: Couleurs.creme,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: Couleurs.nuit },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: "Scanner" }} />
        <Stack.Screen name="produit/[code]" options={{ title: "Résultat" }} />
      </Stack>
    </>
  );
}
