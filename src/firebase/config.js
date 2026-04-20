import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getDatabase } from "firebase/database";
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Sanity check: Ensure config is loaded
if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing. Please restart your Vite server to pick up .env changes.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Use the slightly older persistence method because the modern persistentLocalCache 
// throws an internal assertion core dump in Firebase v12.12.0 during tab cleanup.
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('Offline persistence issue (can be ignored):', err.code);
});

export const rtdb = getDatabase(app);

export default app;
