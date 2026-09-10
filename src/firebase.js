import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAQe1Hbrf9QAmcyH0G2kCfMQ6YLEpk59Uk",
  authDomain: "tableau-de-bord-de-stock-669e8.firebaseapp.com",
  projectId: "tableau-de-bord-de-stock-669e8",
  storageBucket: "tableau-de-bord-de-stock-669e8.firebasestorage.app",
  messagingSenderId: "944435958567",
  appId: "1:944435958567:web:3eda58f8271c530c6ecf02",
  measurementId: "G-PXXVV9METE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
