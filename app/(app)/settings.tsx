import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useContext } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthContext } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { saveThemeMode as saveThemeModeSetting } from "../../services/settingsService";
import { ThemeMode } from "../../theme/ThemeContext";
import { useAppTheme } from "../../theme/useAppTheme";

export default function SettingsScreen() {
  const { colors, mode, setMode } = useAppTheme();
  const { user, isGuest, endGuestMode } = useContext(AuthContext);

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
    if (isGuest) {
      endGuestMode();
      router.replace("/login");
      return;
    }

    await signOut(auth);
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
              {isGuest ? "Du übst als Gast. Dein Fortschritt wird nicht gespeichert." : user?.email}
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
                {isGuest ? "Anmelden oder registrieren" : "Abmelden"}
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
