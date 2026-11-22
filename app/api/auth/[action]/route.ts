import crypto from "node:crypto";
import { createEmailUser, findUserByEmail, findUserByUid, getOrCreateGoogleUser, resetPasswordWithToken, savePasswordResetToken, updateUserProfile } from "@/components/deckai/db/queries";
import { hashPassword, signCustomSessionToken, verifyPassword } from "@/components/deckai/middleware/auth";
import { getDeckUser, jsonError } from "@/components/deckai/server-auth";

export const runtime = "nodejs";
const safe = (u: any) => ({ id: u.id, uid: u.uid, email: u.email, displayName: u.displayName, avatarUrl: u.avatarUrl, plan: u.plan, generationsUsed: u.generationsUsed, authProvider: u.authProvider || "google" });
export async function POST(request: Request, ctx: { params: { action: string } }) {
  try {
    const body = await request.json();
    switch (ctx.params.action) {
      case "register": {
        const email = String(body.email || "").trim().toLowerCase(), password = String(body.password || "");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Please enter a valid email address.");
        if (password.length < 8) return jsonError("Password must be at least 8 characters long.");
        if (await findUserByEmail(email)) return jsonError("An account with this email already exists.", 409);
        const user = await createEmailUser(email, String(body.displayName || email.split("@")[0]).trim(), hashPassword(password));
        return Response.json({ token: signCustomSessionToken({ uid: user.uid, email: user.email, displayName: user.displayName }), user: safe(user) }, { status: 201 });
      }
      case "login": {
        const user = body.email ? await findUserByEmail(String(body.email).trim().toLowerCase()) : null;
        if (!user?.passwordHash || !body.password || !verifyPassword(String(body.password), user.passwordHash)) return jsonError("Invalid email or password.", 401);
        return Response.json({ token: signCustomSessionToken({ uid: user.uid, email: user.email, displayName: user.displayName }), user: safe(user) });
      }
      case "google-sync": {
        const u = await getDeckUser(request); if (!u) return jsonError("Invalid or expired session. Please sign in again.", 401);
        if (u.authProvider !== "google") return jsonError("Google authentication required.", 401);
        const user = await getOrCreateGoogleUser(u.uid, u.email, u.displayName, u.avatarUrl);
        return Response.json({ user: safe(user) });
      }
      case "forgot-password": {
        const email = String(body.email || "").trim().toLowerCase(); if (!email) return jsonError("Please provide your email address.");
        const user = await findUserByEmail(email);
        if (user?.authProvider === "email") {
          const code = crypto.randomInt(100000, 999999).toString();
          await savePasswordResetToken(email, crypto.createHash("sha256").update(code).digest("hex"), new Date(Date.now() + 15 * 60_000));
          return Response.json({ message: "A 6-digit password reset verification code has been issued for your account.", demoResetCode: code });
        }
        return Response.json({ message: "If an email-password account exists for that address, a reset code has been generated." });
      }
      case "reset-password": {
        if (!body.email || !body.code || String(body.newPassword || "").length < 8) return jsonError("Valid email, 6-digit code, and 8+ character password are required.");
        const hash = crypto.createHash("sha256").update(String(body.code).trim()).digest("hex");
        if (!await resetPasswordWithToken(String(body.email).toLowerCase(), hash, hashPassword(String(body.newPassword)))) return jsonError("Invalid or expired reset verification code.");
        return Response.json({ message: "Password updated successfully. You can now sign in." });
      }
      default: return jsonError("Unknown authentication action.", 404);
    }
  } catch (e) { return jsonError(e instanceof Error ? e.message : "Authentication request failed.", 500); }
}
export async function GET(request: Request, ctx: { params: { action: string } }) {
  if (ctx.params.action !== "me") return jsonError("Unknown authentication action.", 404);
  try {
    const auth = await getDeckUser(request); if (!auth) return jsonError("Authentication required. Please sign in.", 401);
    let user = await findUserByUid(auth.uid);
    if (!user && auth.authProvider === "google") user = await getOrCreateGoogleUser(auth.uid, auth.email, auth.displayName, auth.avatarUrl);
    return user ? Response.json({ user: safe(user) }) : jsonError("User account not found.", 404);
  } catch (e) { return jsonError(e instanceof Error ? e.message : "Failed to load profile.", 500); }
}
export async function PATCH(request: Request, ctx: { params: { action: string } }) {
  if (ctx.params.action !== "profile") return jsonError("Unknown authentication action.", 404);
  try {
    const auth = await getDeckUser(request); if (!auth) return jsonError("Authentication required. Please sign in.", 401);
    const body = await request.json(); const updates: {displayName?: string; passwordHash?: string} = {};
    if (body.displayName?.trim()) updates.displayName = body.displayName.trim();
    if (body.newPassword) { if (String(body.newPassword).length < 8) return jsonError("New password must be at least 8 characters."); updates.passwordHash = hashPassword(String(body.newPassword)); }
    const user = await updateUserProfile(auth.uid, updates); return user ? Response.json({ user: safe(user) }) : jsonError("User not found.", 404);
  } catch (e) { return jsonError(e instanceof Error ? e.message : "Failed to update profile.", 500); }
}
