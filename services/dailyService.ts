import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";
import { getTodayKey } from "../utils/date";

export async function getDailyProgress(userId: string, setId: string) {
  const todayKey = getTodayKey();

  const dailyRef = doc(db, "users", userId, "daily", `${setId}_${todayKey}`);

  const snapshot = await getDoc(dailyRef);

  if (!snapshot.exists()) {
    return {
      newCardsStarted: 0,
    };
  }

  const data = snapshot.data();

  return {
    newCardsStarted: data.newCardsStarted ?? 0,
  };
}

export async function incrementNewCardsStarted(userId: string, setId: string) {
  const todayKey = getTodayKey();

  const dailyRef = doc(db, "users", userId, "daily", `${setId}_${todayKey}`);

  await setDoc(
    dailyRef,
    {
      setId,
      newCardsStarted: increment(1),
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}
