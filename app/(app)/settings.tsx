import { router } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../firebase/config";
import { resetUserProgress } from "../../services/progressService";
import { saveThemeMode as saveThemeModeSetting } from "../../services/settingsService";
import { ThemeMode } from "../../theme/ThemeContext";
import { useAppTheme } from "../../theme/useAppTheme";

export default function SettingsScreen() {
  const { colors, mode, setMode } = useAppTheme();

  async function saveThemeMode(value: ThemeMode) {
    const user = auth.currentUser;

    setMode(value);

    if (!user) {
      return;
    }

    try {
      await saveThemeModeSetting(user.uid, value);
    } catch (error) {
      console.error("Theme konnte nicht gespeichert werden:", error);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  async function resetProgress() {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    try {
      await resetUserProgress(user.uid);

      if (Platform.OS === "web") {
        window.alert("Fortschritt wurde zurückgesetzt.");
      } else {
        Alert.alert("Erledigt", "Fortschritt wurde zurückgesetzt.");
      }
    } catch (error) {
      console.error("Fehler beim Zurücksetzen:", error);
    }
  }

  function confirmResetProgress() {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Möchtest du wirklich deinen gesamten Lernfortschritt löschen?",
      );

      if (confirmed) {
        resetProgress();
      }

      return;
    }

    Alert.alert(
      "Fortschritt zurücksetzen",
      "Möchtest du wirklich deinen gesamten Lernfortschritt löschen?",
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Zurücksetzen",
          style: "destructive",
          onPress: resetProgress,
        },
      ],
    );
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              Einstellungen
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Passe deine Lern-App an.
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
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Darstellung
            </Text>

            <Text
              style={[
                styles.label,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Farbschema
            </Text>

            <View style={styles.themeRow}>
              {[
                {
                  value: "system",
                  label: "System",
                },
                {
                  value: "light",
                  label: "Hell",
                },
                {
                  value: "dark",
                  label: "Dunkel",
                },
              ].map((option) => {
                const value = option.value as ThemeMode;
                const selected = mode === value;

                return (
                  <Pressable
                    key={value}
                    style={[
                      styles.themeButton,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.surfaceMuted,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => saveThemeMode(value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: selected ? "#FFFFFF" : colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.danger,
                },
              ]}
            >
              Lernfortschritt
            </Text>

            <Text
              style={[
                styles.helperText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Löscht alle gelernten Karten und Tagesfortschritte. Deine
              Einstellungen bleiben erhalten.
            </Text>

            <Pressable
              style={[
                styles.dangerButton,
                {
                  borderColor: colors.danger,
                },
              ]}
              onPress={confirmResetProgress}
            >
              <Text
                style={[
                  styles.dangerText,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                Fortschritt zurücksetzen
              </Text>
            </Pressable>
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
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Konto
            </Text>

            <Text
              style={[
                styles.accountEmail,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {auth.currentUser?.email}
            </Text>

            <Pressable
              style={[
                styles.logoutButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
              onPress={logout}
            >
              <Text
                style={[
                  styles.logoutText,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Abmelden
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.replace("/")}
          >
            <Text
              style={[
                styles.backButtonText,
                {
                  color: colors.text,
                },
              ]}
            >
              Zurück zum Start
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 24,
  },

  content: {
    width: "100%",
    maxWidth: 600,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },

  header: {
    gap: 4,
    marginBottom: 8,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
  },

  description: {
    fontSize: 16,
  },

  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
  },

  helperText: {
    fontSize: 14,
    lineHeight: 20,
  },

  optionText: {
    fontSize: 15,
    fontWeight: "700",
  },

  themeRow: {
    flexDirection: "row",
    gap: 10,
  },

  themeButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  accountEmail: {
    fontSize: 14,
  },

  logoutButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
  },

  dangerButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  dangerText: {
    fontSize: 15,
    fontWeight: "700",
  },

  backButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
