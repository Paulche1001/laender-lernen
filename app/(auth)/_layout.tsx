import { Redirect, Stack } from "expo-router";
import { useContext } from "react";

import { AuthContext } from "../../context/AuthContext";

export default function AuthLayout() {
  const { user, loading, isGuest } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  if (user || isGuest) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
