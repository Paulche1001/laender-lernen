import { router } from "expo-router";
import { signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth, db } from "../../firebase/config";
import { ThemeMode } from "../../theme/ThemeContext";
import { useAppTheme } from "../../theme/useAppTheme";

export default function SettingsScreen() {
  const { colors, mode, setMode } = useAppTheme();

  const [newCardsPerDay, setNewCardsPerDay] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const settingsRef = doc(db, "users", user.uid, "settings", "preferences");

      const snapshot = await getDoc(settingsRef);

      if (snapshot.exists()) {
        const data = snapshot.data();

        setNewCardsPerDay(data.newCardsPerDay ?? 10);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Einstellungen:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveNewCardsPerDay(value: number) {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    setNewCardsPerDay(value);

    const settingsRef = doc(db, "users", user.uid, "settings", "preferences");

    await setDoc(
      settingsRef,
      {
        newCardsPerDay: value,
      },
      {
        merge: true,
      },
    );
  }

  async function saveThemeMode(value: ThemeMode) {
    const user = auth.currentUser;

    // Sofort UI umschalten
    setMode(value);

    if (!user) {
      return;
    }

    try {
      const settingsRef = doc(db, "users", user.uid, "settings", "preferences");

      await setDoc(
        settingsRef,
        {
          themeMode: value,
        },
        {
          merge: true,
        },
      );
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
      const progressRef = collection(db, "users", user.uid, "progress");

      const dailyRef = collection(db, "users", user.uid, "daily");

      const progressSnapshot = await getDocs(progressRef);

      const dailySnapshot = await getDocs(dailyRef);

      const deleteProgress = progressSnapshot.docs.map((document) =>
        deleteDoc(document.ref),
      );

      const deleteDaily = dailySnapshot.docs.map((document) =>
        deleteDoc(document.ref),
      );

      await Promise.all([...deleteProgress, ...deleteDaily]);

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

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>
            Einstellungen werden geladen...
          </Text>
        </View>
      </SafeAreaView>
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

          {/* Lernen */}
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
              Lernen
            </Text>

            <Text
              style={[
                styles.label,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Neue Karten pro Tag
            </Text>

            <View style={styles.numberControl}>
              <Pressable
                style={[
                  styles.stepButton,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  saveNewCardsPerDay(Math.max(1, newCardsPerDay - 1))
                }
              >
                <Text style={[styles.stepButtonText, { color: colors.text }]}>
                  −
                </Text>
              </Pressable>

              <TextInput
                style={[
                  styles.numberInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
                value={String(newCardsPerDay)}
                onChangeText={(text) => {
                  const value = Number(text);

                  if (Number.isInteger(value) && value >= 1 && value <= 100) {
                    setNewCardsPerDay(value);
                  }
                }}
                onBlur={() => {
                  saveNewCardsPerDay(newCardsPerDay);
                }}
                onSubmitEditing={() => {
                  saveNewCardsPerDay(newCardsPerDay);
                }}
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={3}
                selectTextOnFocus
              />

              <Pressable
                style={[
                  styles.stepButton,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  saveNewCardsPerDay(Math.min(100, newCardsPerDay + 1))
                }
              >
                <Text style={[styles.stepButtonText, { color: colors.text }]}>
                  +
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Zwischen 1 und 100 neue Karten pro Tag
            </Text>

            <Text
              style={[
                styles.helperText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Aktuell {newCardsPerDay} neue Karten pro Tag
            </Text>
          </View>

          {/* Darstellung */}
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

          {/* Gefahrenbereich */}
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

          {/* Konto */}
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

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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

  optionRow: {
    flexDirection: "row",
    gap: 10,
  },

  optionButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
  numberControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  stepButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  stepButtonText: {
    fontSize: 24,
    fontWeight: "600",
  },

  numberInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 12,
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
