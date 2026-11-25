import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import type { Card as FsrsCard } from "ts-fsrs";

import { db } from "../firebase/config";

export type CardProgress = {
  card: FsrsCard;
};

export async function getUserProgress(userId: string, setId: string) {
  const progressRef = collection(db, "users", userId, "progress");

  const snapshot = await getDocs(progressRef);

  const loadedProgress: Record<string, CardProgress> = {};

  // Zuerst neue Einträge laden
  snapshot.forEach((document) => {
    const data = document.data();

    if (data.setId !== setId || !data.cardId || !data.card || !data.card.due) {
      return;
    }

    loadedProgress[data.cardId] = {
      card: {
        ...data.card,
        due: data.card.due.toDate(),
        last_review: data.card.last_review
          ? data.card.last_review.toDate()
          : undefined,
      },
    };
  });

  // Alte Einträge gehören zum bisherigen Länder-Set.
  if (setId === "countries") {
    snapshot.forEach((document) => {
      const data = document.data();

      // Neuer Eintrag -> ignorieren
      if (data.setId || data.cardId) {
        return;
      }

      if (!data.card || !data.card.due) {
        return;
      }

      const countryCode = document.id;

      // Falls schon ein neuer Eintrag existiert,
      // hat dieser Vorrang.
      if (loadedProgress[countryCode]) {
        return;
      }

      loadedProgress[countryCode] = {
        card: {
          ...data.card,
          due: data.card.due.toDate(),
          last_review: data.card.last_review
            ? data.card.last_review.toDate()
            : undefined,
        },
      };
    });
  }

  return loadedProgress;
}

export async function saveCardProgress(
  userId: string,
  setId: string,
  cardId: string,
  card: FsrsCard,
) {
  const progressId = `${setId}_${cardId}`;

  await setDoc(
    doc(db, "users", userId, "progress", progressId),
    {
      setId,
      cardId,
      card: {
        ...card,
        due: card.due,
        last_review: card.last_review ?? null,
      },
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}

export async function resetUserProgress(userId: string) {
  const progressRef = collection(db, "users", userId, "progress");

  const dailyRef = collection(db, "users", userId, "daily");

  const [progressSnapshot, dailySnapshot] = await Promise.all([
    getDocs(progressRef),
    getDocs(dailyRef),
  ]);

  const deleteProgress = progressSnapshot.docs.map((document) =>
    deleteDoc(document.ref),
  );

  const deleteDaily = dailySnapshot.docs.map((document) =>
    deleteDoc(document.ref),
  );

  await Promise.all([...deleteProgress, ...deleteDaily]);
}
