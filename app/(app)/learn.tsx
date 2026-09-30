import { router } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createEmptyCard,
  fsrs,
  Rating as FsrsRating,
  type Card as FsrsCard,
} from "ts-fsrs";
import { flagImages } from "../../assets/flagImages";
import { countries } from "../../data/countries";
import { auth, db } from "../../firebase/config";
import { useAppTheme } from "../../theme/useAppTheme";

type Rating = "again" | "hard" | "good" | "easy";

type CardProgress = {
  card: FsrsCard;
};

const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
  enable_short_term: true,
  learning_steps: ["1m", "10m"],
  relearning_steps: ["10m"],
});

function shuffleArray<T>(array: T[]) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export default function LearnScreen() {
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [progressLoading, setProgressLoading] = useState(true);
  const [newCardsStartedToday, setNewCardsStartedToday] = useState(0);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [newCardsPerDay, setNewCardsPerDay] = useState(10);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [sessionCountries, setSessionCountries] = useState<typeof countries>(
    [],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const country = sessionCountries[currentIndex];

  const { colors } = useAppTheme();

  useEffect(() => {
    loadProgress();
    loadDailyProgress();
    loadSettings();
  }, []);

  useEffect(() => {
    if (progressLoading || dailyLoading || settingsLoading) {
      return;
    }

    if (sessionCountries.length > 0) {
      return;
    }

    const reviewCountries = countries.filter((country) => {
      const cardProgress = progress[country.code];

      return cardProgress && cardProgress.card.due <= new Date();
    });

    const newCountries = countries.filter((country) => {
      return !progress[country.code];
    });

    const remainingNewCards = Math.max(
      0,
      newCardsPerDay - newCardsStartedToday,
    );

    const shuffledReviews = shuffleArray(reviewCountries);

    const shuffledNewCountries = shuffleArray(newCountries).slice(
      0,
      remainingNewCards,
    );

    const newSession = [...shuffledReviews, ...shuffledNewCountries];

    setSessionCountries(newSession);
  }, [progressLoading, dailyLoading, settingsLoading]);

  function toFsrsRating(rating: Rating) {
    switch (rating) {
      case "again":
        return FsrsRating.Again;
      case "hard":
        return FsrsRating.Hard;
      case "good":
        return FsrsRating.Good;
      case "easy":
        return FsrsRating.Easy;
    }
  }

  function getTodayKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async function rateCard(rating: Rating) {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const currentProgress = progress[country.code];

    const currentCard = currentProgress?.card ?? createEmptyCard();

    const now = new Date();

    const result = scheduler.next(currentCard, now, toFsrsRating(rating));

    const nextCard = result.card;

    const isNewCard = !currentProgress;

    await addDoc(collection(db, "users", user.uid, "reviews"), {
      countryCode: country.code,
      rating,
      reviewedAt: now,
      log: result.log,
      updatedAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, "users", user.uid, "progress", country.code),
      {
        card: {
          ...nextCard,
          due: nextCard.due,
          last_review: nextCard.last_review ?? null,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    if (isNewCard) {
      const todayKey = getTodayKey();

      const dailyRef = doc(db, "users", user.uid, "daily", todayKey);

      await setDoc(
        dailyRef,
        {
          newCardsStarted: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setNewCardsStartedToday((prev) => prev + 1);
    }

    setProgress((prevProgress) => ({
      ...prevProgress,
      [country.code]: {
        card: nextCard,
      },
    }));

    setRevealed(false);
    setCurrentIndex((prev) => prev + 1);
  }

  async function loadSettings() {
    const user = auth.currentUser;

    if (!user) {
      setSettingsLoading(false);
      return;
    }

    try {
      const settingsRef = doc(db, "users", user.uid, "settings", "preferences");

      const snapshot = await getDoc(settingsRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setNewCardsPerDay(data.newCardsPerDay ?? 10);
      } else {
        setNewCardsPerDay(10);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Einstellungen:", error);
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadProgress() {
    console.log("loadProgress gestartet");

    const user = auth.currentUser;

    if (!user) {
      setProgressLoading(false);
      return;
    }

    try {
      const progressRef = collection(db, "users", user.uid, "progress");

      const snapshot = await getDocs(progressRef);

      const loadedProgress: Record<string, CardProgress> = {};

      snapshot.forEach((document) => {
        const data = document.data();

        if (!data.card || !data.card.due) {
          return;
        }

        loadedProgress[document.id] = {
          card: {
            ...data.card,
            due: data.card.due.toDate(),
            last_review: data.card.last_review
              ? data.card.last_review.toDate()
              : undefined,
          },
        };
      });

      setProgress(loadedProgress);
      setProgressLoading(false);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
      setProgressLoading(false);
    }
  }

  async function loadDailyProgress() {
    const user = auth.currentUser;

    if (!user) {
      setDailyLoading(false);
      return;
    }

    try {
      const todayKey = getTodayKey();

      const dailyRef = doc(db, "users", user.uid, "daily", todayKey);

      const snapshot = await getDoc(dailyRef);

      if (snapshot.exists()) {
        const data = snapshot.data();

        setNewCardsStartedToday(data.newCardsStarted ?? 0);
      } else {
        setNewCardsStartedToday(0);
      }
    } catch (error) {
      console.error("Fehler beim Laden des Tagesfortschritts:", error);
    } finally {
      setDailyLoading(false);
    }
  }

  if (progressLoading || dailyLoading || settingsLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.centerPage}>
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.stateTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Wird geladen...
            </Text>

            <Text
              style={[
                styles.stateText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Dein Lernfortschritt wird vorbereitet.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (
    sessionCountries.length === 0 ||
    currentIndex >= sessionCountries.length
  ) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.centerPage}>
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.doneEmoji,
                {
                  color: colors.text,
                },
              ]}
            >
              🎉
            </Text>

            <Text
              style={[
                styles.stateTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Alles erledigt
            </Text>

            <Text
              style={[
                styles.stateText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Aktuell sind keine Karten fällig.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.homeButton,
                {
                  backgroundColor: pressed
                    ? colors.primaryPressed
                    : colors.primary,
                },
              ]}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.homeButtonText}>Zurück zum Start</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = progress[country.code]?.card ?? createEmptyCard();

  const progressPercent = ((currentIndex + 1) / sessionCountries.length) * 100;

  const preview = scheduler.repeat(currentCard, new Date());

  function getIntervalLabel(due: Date) {
    const diffMs = due.getTime() - Date.now();
    const minutes = Math.max(1, Math.round(diffMs / 60000));

    if (minutes < 60) {
      return `${minutes}m`;
    }

    if (minutes < 1440) {
      return `${Math.round(minutes / 60)}h`;
    }

    return `${Math.round(minutes / 1440)}d`;
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
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text
                style={[
                  styles.headerTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Lernmodus
              </Text>

              <Text
                style={[
                  styles.sessionProgress,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {currentIndex + 1} von {sessionCountries.length}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: pressed
                    ? colors.surfaceMuted
                    : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.replace("/")}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  {
                    color: colors.text,
                  },
                ]}
              >
                ✕
              </Text>
            </Pressable>
          </View>

          {/* Fortschrittsleiste */}
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: colors.surfaceMuted,
              },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>

          {/* Flashcard */}
          <View
            style={[
              styles.flashcard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.countryName,
                {
                  color: colors.text,
                },
              ]}
            >
              {country.name}
            </Text>

            {revealed ? (
              <View style={styles.answer}>
                <View
                  style={[
                    styles.flagContainer,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image
                    source={flagImages[country.flag]}
                    resizeMode="contain"
                    style={styles.flag}
                  />
                </View>

                <View style={styles.details}>
                  <View>
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      Hauptstadt
                    </Text>

                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {country.capital}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      Sprachen
                    </Text>

                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {country.languages.join(", ")}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.revealButton,
                  {
                    backgroundColor: pressed
                      ? colors.primaryPressed
                      : colors.primary,
                  },
                ]}
                onPress={() => setRevealed(true)}
              >
                <Text style={styles.revealButtonText}>Antwort anzeigen</Text>
              </Pressable>
            )}
          </View>

          {/* Bewertung */}
          {revealed && (
            <View style={styles.ratingSection}>
              <Text
                style={[
                  styles.ratingTitle,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Wie gut wusstest du es?
              </Text>

              <View style={styles.ratingRow}>
                <Pressable
                  style={[
                    styles.ratingButton,
                    {
                      backgroundColor: colors.danger,
                    },
                  ]}
                  onPress={() => rateCard("again")}
                >
                  <Text style={styles.ratingText}>Nochmal</Text>

                  <Text style={styles.intervalText}>
                    {getIntervalLabel(preview[FsrsRating.Again].card.due)}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.ratingButton, styles.hardButton]}
                  onPress={() => rateCard("hard")}
                >
                  <Text style={styles.ratingText}>Schwer</Text>

                  <Text style={styles.intervalText}>
                    {getIntervalLabel(preview[FsrsRating.Hard].card.due)}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.ratingButton, styles.goodButton]}
                  onPress={() => rateCard("good")}
                >
                  <Text style={styles.ratingText}>Gut</Text>

                  <Text style={styles.intervalText}>
                    {getIntervalLabel(preview[FsrsRating.Good].card.due)}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.ratingButton,
                    {
                      backgroundColor: colors.success,
                    },
                  ]}
                  onPress={() => rateCard("easy")}
                >
                  <Text style={styles.ratingText}>Einfach</Text>

                  <Text style={styles.intervalText}>
                    {getIntervalLabel(preview[FsrsRating.Easy].card.due)}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
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
    maxWidth: 650,
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },

  sessionProgress: {
    fontSize: 14,
    marginTop: 2,
  },

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },

  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: 999,
  },

  flashcard: {
    flex: 1,
    width: "100%",
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },

  countryName: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
  },

  answer: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },

  flagContainer: {
    width: "100%",
    maxWidth: 280,
    height: 170,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  flag: {
    width: "100%",
    height: "100%",
  },

  details: {
    width: "100%",
    gap: 16,
  },

  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 18,
    fontWeight: "600",
  },

  revealButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  revealButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  ratingSection: {
    gap: 10,
  },

  ratingTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },

  ratingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  ratingButton: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 58,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  hardButton: {
    backgroundColor: "#D97706",
  },

  goodButton: {
    backgroundColor: "#2563EB",
  },

  ratingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  intervalText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 3,
    opacity: 0.85,
  },
  centerPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  stateCard: {
    width: "100%",
    maxWidth: 500,
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },

  stateTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },

  stateText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },

  doneEmoji: {
    fontSize: 48,
  },

  homeButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  homeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
