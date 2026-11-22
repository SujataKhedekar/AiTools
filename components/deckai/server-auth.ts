import { verifyFirebaseIdToken } from "./lib/firebase-admin";
import { verifyCustomSessionToken, type AuthenticatedUser } from "./middleware/auth";

export async function getDeckUser(request: Request): Promise<AuthenticatedUser | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (token.startsWith("deckai.")) {
    const payload = verifyCustomSessionToken(token);
    return payload ? { uid: payload.uid, email: payload.email, displayName: payload.displayName, authProvider: "email" } : null;
  }
  try {
    const decoded = await verifyFirebaseIdToken(token);
    return { uid: decoded.uid, email: decoded.email || `${decoded.uid}@users.deckai.app`, displayName: decoded.name || decoded.email?.split("@")[0] || "Creator", avatarUrl: decoded.picture, authProvider: "google" };
  } catch { return null; }
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
