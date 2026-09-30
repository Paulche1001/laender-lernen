import { router } from "expo-router";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../firebase/config";
import { useAppTheme } from "../../theme/useAppTheme";

export default function LoginScreen() {
  const { colors } = useAppTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  async function login() {
    if (!email.trim() || !password) {
      Alert.alert(
        "Fehlende Angaben",
        "Bitte gib deine E-Mail-Adresse und dein Passwort ein.",
      );
      return;
    }

    try {
      setLoginLoading(true);

      await signInWithEmailAndPassword(auth, email.trim(), password);

      router.replace("/");
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.log(error.code);

        Alert.alert(
          "Anmeldung fehlgeschlagen",
          "E-Mail oder Passwort ist falsch.",
        );
      } else {
        Alert.alert(
          "Fehler",
          "Bei der Anmeldung ist ein unbekannter Fehler aufgetreten.",
        );
      }
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.page}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Willkommen zurück 🌍
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Melde dich an und lerne dort weiter, wo du aufgehört hast.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.text,
                  },
                ]}
              >
                E-Mail
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="name@beispiel.de"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Passwort
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="Passwort"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                textContentType="password"
                onSubmitEditing={login}
              />
            </View>

            <Pressable
              disabled={loginLoading}
              style={({ pressed }) => [
                styles.loginButton,
                {
                  backgroundColor: pressed
                    ? colors.primaryPressed
                    : colors.primary,
                  opacity: loginLoading ? 0.6 : 1,
                },
              ]}
              onPress={login}
            >
              <Text style={styles.loginButtonText}>
                {loginLoading ? "Wird angemeldet..." : "Anmelden"}
              </Text>
            </Pressable>

            <View style={styles.registerRow}>
              <Text
                style={[
                  styles.registerText,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Noch keinen Account?
              </Text>

              <Pressable onPress={() => router.navigate("/register")}>
                <Text
                  style={[
                    styles.registerLink,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Registrieren
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 20,
    gap: 24,
  },

  header: {
    alignItems: "center",
    gap: 8,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 380,
  },

  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 18,
  },

  inputGroup: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  loginButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  registerText: {
    fontSize: 14,
  },

  registerLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
