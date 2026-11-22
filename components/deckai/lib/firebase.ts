import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { firebaseConfig, hasFirebaseClientConfig } from "./firebase-config";

const app = hasFirebaseClientConfig ? (getApps()[0] || initializeApp(firebaseConfig)) : null;
export const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<{ user: User; idToken: string }> {
  if (!auth) throw new Error("Google sign-in needs the NEXT_PUBLIC_FIREBASE_* settings in .env.local.");
  const result = await signInWithPopup(auth, googleProvider);
  return { user: result.user, idToken: await result.user.getIdToken() };
}
export async function signOutFirebase(): Promise<void> { if (auth) await signOut(auth); }
export function subscribeToFirebaseAuth(callback: (user: User | null, idToken: string | null) => void) {
  if (!auth) { callback(null, null); return () => {}; }
  return onAuthStateChanged(auth, async (user) => {
    if (!user) { callback(null, null); return; }
    try { callback(user, await user.getIdToken()); } catch { callback(null, null); }
  });
}
