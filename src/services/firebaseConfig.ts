import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Single centralized Firebase app instance
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();

export const auth = getAuth(firebaseApp);

// CRITICAL: The app will break without this line per Firebase skill instructions
export const db = getFirestore(
  firebaseApp,
  (firebaseConfigJson as any).firestoreDatabaseId
);

// Standard Google Auth Provider for Firebase Auth & Firestore
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
