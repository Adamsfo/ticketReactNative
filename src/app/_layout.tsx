import { router, Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts_/AuthContext";
import { useEffect } from "react";
import { isAuthenticated } from "../lib/api";

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

function MainLayout() {
  useEffect(() => {
    // if (!isAuthenticated()) {
    //   router.replace("/(panel)/profile/page");
    // } else {
    //   router.replace("/(auth)/singin/page");
    // }
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="(auth)/signin/page"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(auth)/signup/page"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(painel)/profile/page"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
