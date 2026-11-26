import { Redirect, Stack } from "expo-router";
import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";

import { AuthContext } from "../../context/AuthContext";

export default function AppLayout() {
  const { user, loading, isGuest } = useContext(AuthContext);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user && !isGuest) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
