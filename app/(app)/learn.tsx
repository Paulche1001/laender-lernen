import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createEmptyCard } from "ts-fsrs";

import { FlashCard } from "../../components/learning/FlashCard";
import { LearningStateCard } from "../../components/learning/LearningStateCard";
import { RatingButtons } from "../../components/learning/RatingButtons";
import { SessionHeader } from "../../components/learning/SessionHeader";
import { AuthContext } from "../../context/AuthContext";
import { countries } from "../../data/countries";
import { auth } from "../../firebase/config";
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
import { getSetSettings } from "../../services/settingsService";
import { useAppTheme } from "../../theme/useAppTheme";
import { shuffleArray } from "../../utils/shuffle";

function createSession(
  loadedProgress: Record<string, CardProgress>,
  newCardsPerDay: number,
  newCardsStartedToday: number,
) {
  const now = new Date();

  const reviewCountries = countries.filter((country) => {
    const cardProgress = loadedProgress[country.code];

    return cardProgress && cardProgress.card.due <= now;
  });

  const newCountries = countries.filter(
    (country) => !loadedProgress[country.code],
  );

  const remainingNewCards = Math.max(0, newCardsPerDay - newCardsStartedToday);

  const shuffledReviews = shuffleArray(reviewCountries);

  const shuffledNewCountries = shuffleArray(newCountries).slice(
    0,
    remainingNewCards,
  );

  return [...shuffledReviews, ...shuffledNewCountries];
}

export default function LearnScreen() {
  const { user, isGuest, guestCardCount } = useContext(AuthContext);
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [sessionCountries, setSessionCountries] = useState<typeof countries>(
    [],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { colors } = useAppTheme();

  const country = sessionCountries[currentIndex];

  useEffect(() => {
    let cancelled = false;

    async function initializeLearning() {
      setLoading(true);
      setRevealed(false);
      setCurrentIndex(0);

      if (isGuest) {
        setProgress({});
        setSessionCountries(shuffleArray(countries).slice(0, guestCardCount));
        setLoading(false);
        return;
      }

      if (!user) {
        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      try {
        const [loadedProgress, daily, settings] = await Promise.all([
          getUserProgress(user.uid, "countries"),
          getDailyProgress(user.uid, "countries"),
          getSetSettings(user.uid, "countries"),
        ]);

        if (cancelled) {
          return;
        }

        const session = createSession(
          loadedProgress,
          settings.newCardsPerDay,
          daily.newCardsStarted,
        );

        setProgress(loadedProgress);
        setSessionCountries(session);
      } catch (error) {
        console.error("Fehler beim Vorbereiten der Lernsession:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initializeLearning();

    return () => {
      cancelled = true;
    };
  }, [user, isGuest, guestCardCount]);

  async function rateCard(rating: Rating) {
    if (isGuest || isSaving || !country) {
      return;
    }

    const user = auth.currentUser;

    if (!user) {
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

      await saveCardProgress(user.uid, "countries", country.code, nextCard);

      if (isNewCard) {
        await incrementNewCardsStarted(user.uid, "countries");
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
        <LearningStateCard
          title="Wird geladen..."
          text={isGuest ? "Deine Übungsrunde wird vorbereitet." : "Dein Lernfortschritt wird vorbereitet."}
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
          title={isGuest ? "Übung abgeschlossen" : "Alles erledigt"}
          text={isGuest
            ? `Du hast ${sessionCountries.length} Länder geübt. Dein Fortschritt wurde nicht gespeichert. Starte eine neue Runde mit einer neuen zufälligen Auswahl.`
            : "Aktuell sind keine Karten fällig."}
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
            title={isGuest ? "Gastmodus" : "Lernmodus"}
            current={currentIndex + 1}
            total={sessionCountries.length}
            onClose={() => router.replace("/")}
          />

          <FlashCard
            key={country.code}
            country={country}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
          />

          {revealed && isGuest && (
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.nextButton,
                { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
              ]}
              onPress={() => {
                setRevealed(false);
                setCurrentIndex((prev) => prev + 1);
              }}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === sessionCountries.length - 1
                  ? "Übung abschließen"
                  : "Nächstes Land"}
              </Text>
            </Pressable>
          )}

          {revealed && !isGuest && (
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
  nextButton: {
    minHeight: 52,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  safeArea: {
    flex: 1,
  },

  page: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
  },

  content: {
    width: "100%",
    maxWidth: 650,
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
  },
});
