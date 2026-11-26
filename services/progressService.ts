import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import type { Card as FsrsCard } from "ts-fsrs";

import { countries } from "../data/countries";
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

export async function resetSetProgress(userId: string, setId: string) {
  if (!userId || !setId) {
    throw new Error("Benutzer und Lernset müssen angegeben werden.");
  }

  const progressRef = collection(db, "users", userId, "progress");

  const dailyRef = collection(db, "users", userId, "daily");

  const [progressSnapshot, dailySnapshot] = await Promise.all([
    getDocs(progressRef),
    getDocs(dailyRef),
  ]);

  const countryCodes = new Set(countries.map(({ code }) => code));
  const progressToDelete = progressSnapshot.docs.filter((document) => {
    const data = document.data();
    return data.setId === setId || (
      setId === "countries" && !data.setId && !data.cardId && countryCodes.has(document.id)
    );
  });
  const dailyToDelete = dailySnapshot.docs.filter((document) => {
    const data = document.data();
    return data.setId === setId || (
      setId === "countries" && !data.setId && /^\d{4}-\d{2}-\d{2}$/.test(document.id)
    );
  });

  const documents = [...progressToDelete, ...dailyToDelete];
  // Keep requests bounded even for sets with several years of daily records.
  for (let index = 0; index < documents.length; index += 450) {
    const batch = writeBatch(db);
    for (const document of documents.slice(index, index + 450)) {
      batch.delete(document.ref);
    }
    await batch.commit();
  }
}
