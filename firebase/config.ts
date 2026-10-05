import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";

import {
  getAuth,
  // @ts-expect-error Firebase/Expo RN typings resolve the web entry here
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyD_O3d0_eMEPZLV0DFa3vEIxUVCBaQNRoE",
  authDomain: "laender-lernen.firebaseapp.com",
  projectId: "laender-lernen",
  storageBucket: "laender-lernen.firebasestorage.app",
  messagingSenderId: "1058878781665",
  appId: "1:1058878781665:web:41d8a3c35147d422615fa0",
  measurementId: "G-0ZC73MHVM3",
};

const app = initializeApp(firebaseConfig);

export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export const db = getFirestore(app);
