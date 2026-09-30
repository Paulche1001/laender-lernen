import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export async function getUserSettings(userId: string) {
  const settingsRef = doc(db, "users", userId, "settings", "preferences");

  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) {
    return {
      newCardsPerDay: 10,
    };
  }

  const data = snapshot.data();

  return {
    newCardsPerDay: data.newCardsPerDay ?? 10,
  };
}

export async function saveNewCardsPerDay(userId: string, value: number) {
  const settingsRef = doc(db, "users", userId, "settings", "preferences");

  await setDoc(
    settingsRef,
    {
      newCardsPerDay: value,
    },
    {
      merge: true,
    },
  );
}
