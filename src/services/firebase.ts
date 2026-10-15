import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Placeholder configuration - users can paste their Firebase console config here
// If not configured, the app seamlessly runs in LocalStorage mode.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDoHpIz2nKrxsOlFNf40yrTnfzOsTzigNA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tahara-app-c7c8b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tahara-app-c7c8b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tahara-app-c7c8b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "524497406025",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:524497406025:web:1272d082b15ca0c2079798"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    signInAnonymously(auth).catch(() => {
      // Anonymous auth not enabled in console or running offline
    });
  } catch (err) {
    console.warn("Firebase initialization failed, falling back to LocalStorage:", err);
  }
}

export { app, auth, db };
