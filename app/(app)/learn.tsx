import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createEmptyCard } from "ts-fsrs";
import { countries } from "../../data/countries";
import { auth } from "../../firebase/config";
import { useAppTheme } from "../../theme/useAppTheme";

import { scheduler, toFsrsRating, type Rating } from "../../learning/fsrs";
import {
  getDailyProgress,
  incrementNewCardsStarted,
} from "../../services/dailyService";
import {
  getUserProgress,
  saveCardProgress,
  type CardProgress,
} from "../../services/progressService";
import { saveReview } from "../../services/reviewService";
import { getUserSettings } from "../../services/settingsService";
import { shuffleArray } from "../../utils/shuffle";

/* UI */
import { FlashCard } from "../../components/learning/FlashCard";
import { LearningStateCard } from "../../components/learning/LearningStateCard";
import { RatingButtons } from "../../components/learning/RatingButtons";
import { SessionHeader } from "../../components/learning/SessionHeader";

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
  const [isSaving, setIsSaving] = useState(false);

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

  async function rateCard(rating: Rating) {
    if (isSaving) {
      return;
    }

    const user = auth.currentUser;

    if (!user || !country) {
      return;
    }

    setIsSaving(true);

    try {
      const currentProgress = progress[country.code];
      const currentCard = currentProgress?.card ?? createEmptyCard();

      const now = new Date();

      const result = scheduler.next(currentCard, now, toFsrsRating(rating));

      const nextCard = result.card;
      const isNewCard = !currentProgress;

      await saveReview({
        userId: user.uid,
        countryCode: country.code,
        rating,
        reviewedAt: now,
        log: result.log,
      });

      await saveCardProgress(user.uid, country.code, nextCard);

      if (isNewCard) {
        await incrementNewCardsStarted(user.uid);

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
    } catch (error) {
      console.error("Fehler beim Speichern der Bewertung:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function loadDailyProgress() {
    const user = auth.currentUser;

    if (!user) {
      setDailyLoading(false);
      return;
    }

    try {
      const daily = await getDailyProgress(user.uid);

      setNewCardsStartedToday(daily.newCardsStarted);
    } catch (error) {
      console.error("Fehler beim Laden des Tagesfortschritts:", error);
    } finally {
      setDailyLoading(false);
    }
  }

  async function loadSettings() {
    const user = auth.currentUser;

    if (!user) {
      setSettingsLoading(false);
      return;
    }

    try {
      const settings = await getUserSettings(user.uid);

      setNewCardsPerDay(settings.newCardsPerDay);
    } catch (error) {
      console.error("Fehler beim Laden der Einstellungen:", error);
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadProgress() {
    const user = auth.currentUser;

    if (!user) {
      setProgressLoading(false);
      return;
    }

    try {
      const loadedProgress = await getUserProgress(user.uid);

      setProgress(loadedProgress);
    } catch (error) {
      console.error("Fehler beim Laden des Fortschritts:", error);
    } finally {
      setProgressLoading(false);
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
        <LearningStateCard
          title="Wird geladen..."
          text="Dein Lernfortschritt wird vorbereitet."
        />
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
        <LearningStateCard
          emoji="🎉"
          title="Alles erledigt"
          text="Aktuell sind keine Karten fällig."
          buttonLabel="Zurück zum Start"
          onPress={() => router.replace("/")}
        />
      </SafeAreaView>
    );
  }

  const currentCard = progress[country.code]?.card ?? createEmptyCard();

  const preview = scheduler.repeat(currentCard, new Date());

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
          <SessionHeader
            current={currentIndex + 1}
            total={sessionCountries.length}
            onClose={() => router.replace("/")}
          />

          <FlashCard
            country={country}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
          />

          {revealed && (
            <RatingButtons
              preview={preview}
              onRate={rateCard}
              disabled={isSaving}
            />
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
});
