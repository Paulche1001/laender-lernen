import { router, useFocusEffect } from "expo-router";
import { useCallback, useContext, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDailyProgress } from "../../services/dailyService";
import { getUserProgress } from "../../services/progressService";

import { AuthContext } from "../../context/AuthContext";
import { countries } from "../../data/countries";
import { getSetSettings } from "../../services/settingsService";
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
      let cancelled = false;

      async function loadCardCounts() {
        if (!user) {
          return;
        }

        setCardsLoading(true);

        try {
          const [progress, daily, settings] = await Promise.all([
            getUserProgress(user.uid, "countries"),
            getDailyProgress(user.uid, "countries"),
            getSetSettings(user.uid, "countries"),
          ]);

          if (cancelled) {
            return;
          }

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
          if (!cancelled) {
            setCardsLoading(false);
          }
        }
      }

      loadCardCounts();

      return () => {
        cancelled = true;
      };
    }, [user]),
  );

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
          <View style={styles.headerRow}>
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

            <Pressable
              style={({ pressed }) => [
                styles.settingsButton,
                {
                  backgroundColor: pressed
                    ? colors.surfaceMuted
                    : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.navigate("/settings")}
            >
              <Text
                style={[
                  styles.settingsButtonText,
                  {
                    color: colors.text,
                  },
                ]}
              >
                ⚙️
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
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text
                  style={[
                    styles.setTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Länder 🌍
                </Text>

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
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.moreButton,
                  {
                    backgroundColor: pressed
                      ? colors.surfaceMuted
                      : "transparent",
                  },
                ]}
                onPress={() =>
                  router.navigate({
                    pathname: "/set-settings",
                    params: {
                      setId: "countries",
                    },
                  })
                }
              >
                <Text
                  style={[
                    styles.moreButtonText,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  ⋮
                </Text>
              </Pressable>
            </View>

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

                <Pressable
                  style={({ pressed }) => [
                    styles.cardStartButton,
                    {
                      backgroundColor: pressed
                        ? colors.primaryPressed
                        : colors.primary,
                    },
                  ]}
                  onPress={() => router.navigate("/learn")}
                >
                  <Text style={styles.cardStartButtonText}>Lernen starten</Text>
                </Pressable>
              </>
            )}
          </View>

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

  spacer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },

  header: {
    flex: 1,
    gap: 6,
  },

  settingsButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  settingsButtonText: {
    fontSize: 20,
  },

  cardStartButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },

  cardStartButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  cardHeaderText: {
    flex: 1,
    gap: 4,
  },

  setTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  moreButtonText: {
    fontSize: 26,
    fontWeight: "600",
    lineHeight: 28,
  },
});
