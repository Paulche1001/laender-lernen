import { doc, getDoc } from "firebase/firestore";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { useColorScheme } from "react-native";

import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase/config";
import { darkColors, lightColors } from "./colors";

export type ThemeMode = "system" | "light" | "dark";

type ThemeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: typeof lightColors;
};

export const ThemeContext = createContext<ThemeContextType>({
  mode: "system",
  setMode: () => {},
  isDark: false,
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useContext(AuthContext);

  const systemColorScheme = useColorScheme();

  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    async function loadTheme() {
      if (!user) {
        setMode("system");
        return;
      }

      try {
        const settingsRef = doc(
          db,
          "users",
          user.uid,
          "settings",
          "preferences",
        );

        const snapshot = await getDoc(settingsRef);

        if (snapshot.exists()) {
          const savedMode = snapshot.data().themeMode;

          if (
            savedMode === "system" ||
            savedMode === "light" ||
            savedMode === "dark"
          ) {
            setMode(savedMode);
          }
        }
      } catch (error) {
        console.error("Theme konnte nicht geladen werden:", error);
      }
    }

    loadTheme();
  }, [user]);

  const isDark =
    mode === "dark" || (mode === "system" && systemColorScheme === "dark");

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        isDark,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
