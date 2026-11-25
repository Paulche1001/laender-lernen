import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebase/config";
import type { ThemeMode } from "../theme/ThemeContext";

const DEFAULT_SET_NEW_CARDS_PER_DAY = 10;

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export async function getUserSettings(userId: string) {
  const settingsRef = doc(db, "users", userId, "settings", "preferences");

  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) {
    return {
      themeMode: "system" as ThemeMode,
    };
  }

  const data = snapshot.data();

  return {
    themeMode: isThemeMode(data.themeMode)
      ? data.themeMode
      : ("system" as ThemeMode),
  };
}

export async function saveThemeMode(userId: string, value: ThemeMode) {
  const settingsRef = doc(db, "users", userId, "settings", "preferences");

  await setDoc(
    settingsRef,
    {
      themeMode: value,
    },
    {
      merge: true,
    },
  );
}

export async function getSetSettings(userId: string, setId: string) {
  const settingsRef = doc(db, "users", userId, "setSettings", setId);

  const snapshot = await getDoc(settingsRef);

  return {
    newCardsPerDay:
      snapshot.data()?.newCardsPerDay ?? DEFAULT_SET_NEW_CARDS_PER_DAY,
  };
}

export async function saveSetNewCardsPerDay(
  userId: string,
  setId: string,
  value: number,
) {
  const settingsRef = doc(db, "users", userId, "setSettings", setId);

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
