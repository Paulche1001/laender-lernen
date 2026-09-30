import { Stack } from "expo-router";

import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../theme/ThemeContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </AuthProvider>
  );
}
