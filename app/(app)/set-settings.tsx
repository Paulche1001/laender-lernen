import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../firebase/config";
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

  const params = useLocalSearchParams<{
    setId?: string;
  }>();

  const setId = params.setId ?? "countries";
  const setTitle = getSetTitle(setId);

  const [newCardsPerDay, setNewCardsPerDay] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
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
  }, [setId]);

  async function updateNewCardsPerDay(value: number) {
    const user = auth.currentUser;

    const safeValue = Math.max(0, Math.min(100, value));

    setNewCardsPerDay(safeValue);

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
              Neue Karten pro Tag
            </Text>

            <Text
              style={[
                styles.helperText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Bestimmt, wie viele neue Karten dieses Set pro Tag hinzufügen
              darf.
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
                disabled={saving}
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
                selectTextOnFocus
                editable={!saving}
                onChangeText={(text) => {
                  const value = Number(text);

                  if (!Number.isNaN(value)) {
                    setNewCardsPerDay(value);
                  }
                }}
                onEndEditing={() => updateNewCardsPerDay(newCardsPerDay)}
              />

              <Pressable
                style={[
                  styles.stepButton,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
                disabled={saving}
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

          <Pressable
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
