import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthContext } from "../../context/AuthContext";
import { countries } from "../../data/countries";
import { auth, db } from "../../firebase/config";
import { useAppTheme } from "../../theme/useAppTheme";

export default function HomeScreen() {
  const { user, loading } = useContext(AuthContext);
  const { colors } = useAppTheme();

  const [dueCount, setDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [unlearnedCount, setUnlearnedCount] = useState(0);

  const totalCards = dueCount + newCount;

  useEffect(() => {
    if (user) {
      loadCardCounts();
    }
  }, [user]);

  function getTodayKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async function loadCardCounts() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setCardsLoading(false);
      return;
    }

    try {
      const progressRef = collection(db, "users", currentUser.uid, "progress");

      const progressSnapshot = await getDocs(progressRef);

      const learnedCountryCodes = new Set<string>();

      let due = 0;

      progressSnapshot.forEach((document) => {
        const data = document.data();

        if (!data.card?.due) {
          return;
        }

        learnedCountryCodes.add(document.id);

        const dueDate = data.card.due.toDate();

        if (dueDate <= new Date()) {
          due++;
        }
      });

      const settingsRef = doc(
        db,
        "users",
        currentUser.uid,
        "settings",
        "preferences",
      );

      const settingsSnapshot = await getDoc(settingsRef);

      const newCardsPerDay = settingsSnapshot.data()?.newCardsPerDay ?? 10;

      const dailyRef = doc(
        db,
        "users",
        currentUser.uid,
        "daily",
        getTodayKey(),
      );

      const dailySnapshot = await getDoc(dailyRef);

      const newCardsStartedToday = dailySnapshot.data()?.newCardsStarted ?? 0;

      const remainingNewCards = Math.max(
        0,
        newCardsPerDay - newCardsStartedToday,
      );

      const availableNewCountries = countries.filter(
        (country) => !learnedCountryCodes.has(country.code),
      ).length;

      setUnlearnedCount(availableNewCountries);

      const newCards = Math.min(availableNewCountries, remainingNewCards);

      setDueCount(due);
      setNewCount(newCards);
    } catch (error) {
      console.error("Fehler beim Laden der Kartenanzahl:", error);
    } finally {
      setCardsLoading(false);
    }
  }

  async function logout() {
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
