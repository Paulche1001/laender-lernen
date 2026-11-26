import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, ReactNode, useEffect, useState } from "react";

import { auth } from "../firebase/config";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  guestCardCount: number;
  startGuestMode: () => void;
  endGuestMode: () => void;
  setGuestCardCount: (count: number) => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  guestCardCount: 10,
  startGuestMode: () => {},
  endGuestMode: () => {},
  setGuestCardCount: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);
  const [guestCardCount, setGuestCardCountState] = useState(10);

  function startGuestMode() {
    setGuestCardCountState(10);
    setGuestMode(true);
  }

  function endGuestMode() {
    setGuestMode(false);
    setGuestCardCountState(10);
  }

  function setGuestCardCount(count: number) {
    if (Number.isFinite(count)) {
      setGuestCardCountState(Math.max(1, Math.min(100, Math.trunc(count))));
    }
  }

  useEffect(() => {
    console.log("AuthProvider gestartet");

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth geändert:", firebaseUser?.email ?? "kein Benutzer");

      setUser(firebaseUser);
      if (firebaseUser) {
        setGuestMode(false);
        setGuestCardCountState(10);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest: guestMode && !user,
        guestCardCount,
        startGuestMode,
        endGuestMode,
        setGuestCardCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
