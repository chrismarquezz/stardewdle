import { getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";
import { getFirebaseConfig } from "./firebaseConfig";

const { config: firebaseConfig, missing } = getFirebaseConfig(import.meta.env);
const existingApp = getApps().find((app) => app.name === "stardewdle");

export const isFirebaseConfigured = firebaseConfig !== null;
export const missingFirebaseConfig = missing;
export const firebaseApp = isFirebaseConfigured
  ? existingApp ?? initializeApp(firebaseConfig, "stardewdle")
  : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const functions = firebaseApp ? getFunctions(firebaseApp, "us-east4") : null;

export function subscribeToAuthChanges(onUser, onError) {
  if (!auth) {
    throw new Error("Account sign-in is not configured for this deployment.");
  }
  return onAuthStateChanged(auth, onUser, onError);
}

export function signInWithGoogle() {
  if (!auth) {
    throw new Error("Account sign-in is not configured for this deployment.");
  }
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signInWithEmail(email, password) {
  if (!auth) {
    throw new Error("Account sign-in is not configured for this deployment.");
  }
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function createEmailAccount(email, password) {
  if (!auth) {
    throw new Error("Account sign-in is not configured for this deployment.");
  }
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

export function signOutUser() {
  if (!auth) {
    throw new Error("Account sign-in is not configured for this deployment.");
  }
  return signOut(auth);
}

export async function adminResetDailyProgress(supportId, reason) {
  if (!functions) {
    throw new Error("Account services are not configured for this deployment.");
  }
  const reset = httpsCallable(functions, "adminResetDailyProgress");
  const response = await reset({ supportId, reason });
  return response.data;
}

if (
  auth
  && db
  && functions
  && !existingApp
  && import.meta.env.DEV
  && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true"
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
