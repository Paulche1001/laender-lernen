import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_O3d0_eMEPZLV0DFa3vEIxUVCBaQNRoE",
  authDomain: "laender-lernen.firebaseapp.com",
  projectId: "laender-lernen",
  storageBucket: "laender-lernen.firebasestorage.app",
  messagingSenderId: "1058878781665",
  appId: "1:1058878781665:web:41d8a3c35147d422615fa0",
  measurementId: "G-0ZC73MHVM3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);