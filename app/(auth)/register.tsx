import { router } from "expo-router";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
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

export default function RegisterScreen() {
  const { colors } = useAppTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  async function register() {
    if (!email.trim() || !password) {
      Alert.alert(
        "Fehlende Angaben",
        "Bitte gib eine E-Mail-Adresse und ein Passwort ein.",
      );
      return;
    }

    try {
      setRegisterLoading(true);

      await createUserWithEmailAndPassword(auth, email.trim(), password);

      router.replace("/");
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.log(error.code);

        let message = "Registrierung fehlgeschlagen.";

        if (error.code === "auth/email-already-in-use") {
          message = "Für diese E-Mail-Adresse existiert bereits ein Konto.";
        }

        if (error.code === "auth/invalid-email") {
          message = "Die E-Mail-Adresse ist ungültig.";
        }

        if (error.code === "auth/weak-password") {
          message =
            "Das Passwort ist zu schwach. Verwende mindestens 6 Zeichen.";
        }

        Alert.alert("Registrierung fehlgeschlagen", message);
      } else {
        Alert.alert(
          "Fehler",
          "Bei der Registrierung ist ein unbekannter Fehler aufgetreten.",
        );
      }
    } finally {
      setRegisterLoading(false);
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
              Konto erstellen 🌍
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Erstelle ein Konto und speichere deinen Lernfortschritt.
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
                placeholder="Mindestens 6 Zeichen"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                textContentType="newPassword"
                onSubmitEditing={register}
              />
            </View>

            <Pressable
              disabled={registerLoading}
              style={({ pressed }) => [
                styles.registerButton,
                {
                  backgroundColor: pressed
                    ? colors.primaryPressed
                    : colors.primary,
                  opacity: registerLoading ? 0.6 : 1,
                },
              ]}
              onPress={register}
            >
              <Text style={styles.registerButtonText}>
                {registerLoading ? "Konto wird erstellt..." : "Konto erstellen"}
              </Text>
            </Pressable>

            <View style={styles.loginRow}>
              <Text
                style={[
                  styles.loginText,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Bereits einen Account?
              </Text>

              <Pressable onPress={() => router.navigate("/login")}>
                <Text
                  style={[
                    styles.loginLink,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Anmelden
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

  registerButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  loginText: {
    fontSize: 14,
  },

  loginLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
