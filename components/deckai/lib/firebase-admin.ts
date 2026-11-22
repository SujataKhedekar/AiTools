import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export async function verifyFirebaseIdToken(token: string) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase Admin needs FIREBASE_PROJECT_ID and valid server credentials.");
  const app = getApps()[0] || initializeApp({ projectId });
  return getAuth(app).verifyIdToken(token);
}
