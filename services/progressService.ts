import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { Card as FsrsCard } from "ts-fsrs";

import { db } from "../firebase/config";

export type CardProgress = {
  card: FsrsCard;
};

export async function getUserProgress(userId: string) {
  const progressRef = collection(db, "users", userId, "progress");

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

  return loadedProgress;
}

export async function saveCardProgress(
  userId: string,
  countryCode: string,
  card: FsrsCard,
) {
  await setDoc(
    doc(db, "users", userId, "progress", countryCode),
    {
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
