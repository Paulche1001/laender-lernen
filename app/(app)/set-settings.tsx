import { router, useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthContext } from "../../context/AuthContext";
import { resetSetProgress } from "../../services/progressService";
import {
    getSetSettings,
    saveSetNewCardsPerDay,
} from "../../services/settingsService";
import { useAppTheme } from "../../theme/useAppTheme";

function getSetTitle(setId: string) {
  switch (setId) {
    case "countries":
      return "Länder";

    case "flags":
      return "Flaggen";

    case "capitals":
      return "Hauptstädte";

    default:
      return "Lernset";
  }
}

export default function SetSettingsScreen() {
  const { colors } = useAppTheme();
  const { user, isGuest, guestCardCount, setGuestCardCount } = useContext(AuthContext);

  const params = useLocalSearchParams<{
    setId?: string;
  }>();

  const setId = params.setId ?? "countries";
  const setTitle = getSetTitle(setId);

  const [newCardsPerDay, setNewCardsPerDay] = useState(isGuest ? guestCardCount : 10);
  const [loading, setLoading] = useState(!isGuest);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const resetInFlight = useRef(false);

  useEffect(() => {
    if (isGuest || !user) {
      return;
    }

    let cancelled = false;

    getSetSettings(user.uid, setId)
      .then((settings) => {
        if (!cancelled) {
          setNewCardsPerDay(settings.newCardsPerDay);
        }
      })
      .catch((error) => {
        console.error("Set-Einstellungen konnten nicht geladen werden:", error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setId, user, isGuest]);

  async function updateNewCardsPerDay(value: number) {
    if (resetInFlight.current || !Number.isFinite(value)) {
      return;
    }

    const safeValue = Math.max(isGuest ? 1 : 0, Math.min(100, Math.trunc(value)));

    setNewCardsPerDay(safeValue);

    if (isGuest) {
      setGuestCardCount(safeValue);
      return;
    }

    if (!user) {
      return;
    }

    setSaving(true);

    try {
      await saveSetNewCardsPerDay(user.uid, setId, safeValue);
    } catch (error) {
      console.error(
        "Neue Karten pro Tag konnten nicht gespeichert werden:",
        error,
      );
    } finally {
      setSaving(false);
    }
  }

  function showMessage(title: string, message: string) {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }

  async function resetProgress() {
    if (!user || isGuest || resetInFlight.current || saving) {
      return;
    }

    resetInFlight.current = true;
    setResetting(true);
    try {
      await resetSetProgress(user.uid, setId);
      showMessage("Fortschritt zurückgesetzt", `Der Lernfortschritt im Set „${setTitle}“ wurde zurückgesetzt.`);
    } catch (error) {
      console.error("Set-Fortschritt konnte nicht zurückgesetzt werden:", error);
      showMessage("Zurücksetzen fehlgeschlagen", "Der Fortschritt konnte nicht vollständig zurückgesetzt werden. Bitte prüfe deine Verbindung und versuche es erneut.");
    } finally {
      resetInFlight.current = false;
      setResetting(false);
    }
  }

  function confirmResetProgress() {
    if (!user || isGuest || resetInFlight.current || saving) {
      return;
    }

    const warning = `Achtung: Du löschst alle gelernten Karten und Tagesfortschritte im Set „${setTitle}“.\n\nDas kann in der App nicht rückgängig gemacht werden. Andere Lernsets und deine Einstellungen bleiben erhalten.\n\nMöchtest du das Set „${setTitle}“ wirklich zurücksetzen?`;
    if (Platform.OS === "web") {
      if (window.confirm(warning)) {
        void resetProgress();
      }
      return;
    }

    Alert.alert(`„${setTitle}“ zurücksetzen?`, warning, [
      { text: "Abbrechen", style: "cancel", isPreferred: true },
      { text: "Ja, Fortschritt löschen", style: "destructive", onPress: () => void resetProgress() },
    ]);
  }

  if (loading && !isGuest) {
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
          <Text
            style={{
              color: colors.text,
            }}
          >
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.page}>
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
              {setTitle}
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Einstellungen für dieses Lernset
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
              {isGuest ? "Länder pro Übungsrunde" : "Neue Karten pro Tag"}
            </Text>

            <Text
              style={[
                styles.helperText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {isGuest
                ? "Wähle zwischen 1 und 100 zufälligen Ländern pro Runde. Dein Fortschritt wird nicht gespeichert."
                : "Bestimmt, wie viele neue Karten dieses Set pro Tag hinzufügen darf."}
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
                disabled={saving || resetting}
                onPress={() => updateNewCardsPerDay(newCardsPerDay - 1)}
              >
                <Text
                  style={[
                    styles.stepButtonText,
                    {
                      color: colors.text,
                    },
                  ]}
                >
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
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
                editable={!saving && !resetting}
                onChangeText={(text) => {
                  const value = Number(text);

                  if (!Number.isNaN(value)) {
                    setNewCardsPerDay(value);
                  }
                }}
                onBlur={() => updateNewCardsPerDay(newCardsPerDay)}
                onSubmitEditing={() => updateNewCardsPerDay(newCardsPerDay)}
              />

              <Pressable
                style={[
                  styles.stepButton,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
                disabled={saving || resetting}
                onPress={() => updateNewCardsPerDay(newCardsPerDay + 1)}
              >
                <Text
                  style={[
                    styles.stepButtonText,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  +
                </Text>
              </Pressable>
            </View>

            {saving && (
              <Text
                style={[
                  styles.savingText,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Wird gespeichert...
              </Text>
            )}
          </View>

          {!isGuest && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>
                Lernfortschritt zurücksetzen
              </Text>
              <Text style={[styles.helperText, { color: colors.text }]}>
                Achtung: Alle gelernten Karten und Tagesfortschritte im Set „{setTitle}“
                werden gelöscht. Das kann in der App nicht rückgängig gemacht werden.
              </Text>
              <Text style={[styles.helperText, { color: colors.textMuted }]}>
                Andere Lernsets und deine Einstellungen bleiben erhalten.
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={saving || resetting}
                style={({ pressed }) => [
                  styles.dangerButton,
                  { borderColor: colors.danger, backgroundColor: pressed ? colors.surfaceMuted : colors.surface, opacity: saving || resetting ? 0.6 : 1 },
                ]}
                onPress={confirmResetProgress}
              >
                <Text style={[styles.dangerText, { color: colors.danger }]}>
                  {resetting ? "Wird zurückgesetzt…" : `Fortschritt für „${setTitle}“ zurücksetzen`}
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            disabled={resetting}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <Text
              style={[
                styles.backButtonText,
                {
                  color: colors.text,
                },
              ]}
            >
              Zurück
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

  page: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 24,
  },

  content: {
    width: "100%",
    maxWidth: 600,
    paddingHorizontal: 20,
    paddingTop: 24,
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

  subtitle: {
    fontSize: 16,
  },

  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  helperText: {
    fontSize: 14,
    lineHeight: 20,
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

  savingText: {
    fontSize: 13,
    textAlign: "center",
  },

  dangerButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  dangerText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
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
