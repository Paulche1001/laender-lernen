import { router, useFocusEffect } from "expo-router";
import { useCallback, useContext, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDailyProgress } from "../../services/dailyService";
import { getUserProgress } from "../../services/progressService";
import { getUserSettings } from "../../services/settingsService";

import { AuthContext } from "../../context/AuthContext";
import { countries } from "../../data/countries";
import { useAppTheme } from "../../theme/useAppTheme";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { colors } = useAppTheme();

  const [dueCount, setDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [unlearnedCount, setUnlearnedCount] = useState(0);

  const totalCards = dueCount + newCount;

  useFocusEffect(
    useCallback(() => {
      loadCardCounts();
    }, [user]),
  );

  async function loadCardCounts() {
    if (!user) {
      setCardsLoading(false);
      return;
    }

    setCardsLoading(true);

    try {
      const [progress, settings, daily] = await Promise.all([
        getUserProgress(user.uid),
        getUserSettings(user.uid),
        getDailyProgress(user.uid),
      ]);

      const learnedCountryCodes = new Set(Object.keys(progress));

      const now = new Date();

      const due = Object.values(progress).filter(
        ({ card }) => card.due <= now,
      ).length;

      const availableNewCountries = countries.filter(
        (country) => !learnedCountryCodes.has(country.code),
      ).length;

      const remainingNewCards = Math.max(
        0,
        settings.newCardsPerDay - daily.newCardsStarted,
      );

      const newCards = Math.min(availableNewCountries, remainingNewCards);

      setDueCount(due);
      setNewCount(newCards);
      setUnlearnedCount(availableNewCountries);
    } catch (error) {
      console.error("Fehler beim Laden der Kartenanzahl:", error);
    } finally {
      setCardsLoading(false);
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
              Länder lernen 🌍
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Lerne Länder, Hauptstädte und Sprachen
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
                styles.cardLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Heute zu lernen
            </Text>

            {cardsLoading ? (
              <Text
                style={[
                  styles.cardCount,
                  {
                    color: colors.text,
                  },
                ]}
              >
                ...
              </Text>
            ) : (
              <>
                <Text
                  style={[
                    styles.cardCount,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {totalCards}
                </Text>

                <Text
                  style={[
                    styles.cardDescription,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {dueCount} Wiederholungen · {newCount} neue Karten
                </Text>
                <Text
                  style={[
                    styles.cardDescription,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  Noch {unlearnedCount} ungelernt
                </Text>
              </>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: pressed
                  ? colors.primaryPressed
                  : colors.primary,
              },
            ]}
            onPress={() => router.navigate("/learn")}
          >
            <Text style={styles.primaryButtonText}>Lernen starten</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.navigate("/settings")}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                {
                  color: colors.text,
                },
              ]}
            >
              Einstellungen
            </Text>
          </Pressable>

          <View style={styles.spacer} />
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 16,
  },

  header: {
    gap: 6,
    marginBottom: 8,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },

  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 6,
  },

  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  cardCount: {
    fontSize: 40,
    fontWeight: "800",
  },

  cardDescription: {
    fontSize: 15,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  spacer: {
    flex: 1,
  },

  accountCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },

  accountLabel: {
    fontSize: 13,
    fontWeight: "600",
  },

  accountText: {
    fontSize: 15,
  },

  logoutButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
