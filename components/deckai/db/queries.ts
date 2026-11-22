import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index';
import { presentations, users } from './schema';
import type { Slide } from '../types/deck';

interface FallbackUserRecord {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  passwordHash: string | null;
  authProvider: string;
  plan: string;
  generationsUsed: number;
  stripeCustomerId: string | null;
  resetTokenHash: string | null;
  resetTokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FallbackPresentationRecord {
  id: number;
  publicId: string;
  userId: number;
  title: string;
  subtitle: string;
  presentationType: string;
  themeId: string;
  isFavorite: boolean;
  isPublic: boolean;
  slidesJson: Slide[];
  googleSlidesId: string | null;
  googleSlidesUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FallbackStoreData {
  nextUserId: number;
  nextPresentationId: number;
  users: FallbackUserRecord[];
  presentations: FallbackPresentationRecord[];
}

const FALLBACK_STORE_PATH = path.resolve('/tmp', 'deckai_fallback_store.json');

function isDbSocketUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; cause?: unknown };
  const code = err.code || '';
  const msg = err.message || '';
  if (
    code === 'ENOENT' ||
    code === 'ECONNREFUSED' ||
    msg.includes('ENOENT') ||
    msg.includes('ECONNREFUSED')
  ) {
    return true;
  }
  if (err.cause) return isDbSocketUnavailable(err.cause);
  return false;
}

function readFallbackStore(): FallbackStoreData {
  try {
    if (fs.existsSync(FALLBACK_STORE_PATH)) {
      const raw = fs.readFileSync(FALLBACK_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as FallbackStoreData;
      return {
        nextUserId: parsed.nextUserId || 1,
        nextPresentationId: parsed.nextPresentationId || 1,
        users: (parsed.users || []).map((u) => ({
          ...u,
          resetTokenExpiresAt: u.resetTokenExpiresAt ? new Date(u.resetTokenExpiresAt) : null,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        })),
        presentations: (parsed.presentations || []).map((p) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })),
      };
    }
  } catch {
    // Initialize fresh store
  }
  return { nextUserId: 1, nextPresentationId: 1, users: [], presentations: [] };
}

function writeFallbackStore(data: FallbackStoreData): void {
  try {
    fs.writeFileSync(FALLBACK_STORE_PATH, JSON.stringify(data), 'utf8');
  } catch (err) {
    console.error('Unable to persist fallback store:', err);
  }
}

export async function getOrCreateGoogleUser(
  uid: string,
  email: string,
  displayName: string,
  avatarUrl?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email.toLowerCase(),
        displayName,
        avatarUrl: avatarUrl || null,
        authProvider: 'google',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email.toLowerCase(),
          displayName,
          avatarUrl: avatarUrl || null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const idx = store.users.findIndex((u) => u.uid === uid);
      const now = new Date();
      if (idx >= 0) {
        store.users[idx] = {
          ...store.users[idx],
          email: email.toLowerCase(),
          displayName,
          avatarUrl: avatarUrl || null,
          updatedAt: now,
        };
        writeFallbackStore(store);
        return store.users[idx];
      }
      const created: FallbackUserRecord = {
        id: store.nextUserId++,
        uid,
        email: email.toLowerCase(),
        displayName,
        avatarUrl: avatarUrl || null,
        passwordHash: null,
        authProvider: 'google',
        plan: 'free',
        generationsUsed: 0,
        stripeCustomerId: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        createdAt: now,
        updatedAt: now,
      };
      store.users.push(created);
      writeFallbackStore(store);
      return created;
    }
    console.error('Database query failed in getOrCreateGoogleUser:', error);
    throw new Error('Unable to sync user profile.', { cause: error });
  }
}

export async function findUserByEmail(email: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      return store.users.find((u) => u.email === email.toLowerCase()) || null;
    }
    console.error('Database query failed in findUserByEmail:', error);
    throw new Error('Unable to look up account.', { cause: error });
  }
}

export async function findUserByUid(uid: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      return store.users.find((u) => u.uid === uid) || null;
    }
    console.error('Database query failed in findUserByUid:', error);
    throw new Error('Unable to load user profile.', { cause: error });
  }
}

export async function createEmailUser(
  email: string,
  displayName: string,
  passwordHash: string
) {
  try {
    const uid = `email_${crypto.randomUUID()}`;
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email.toLowerCase(),
        displayName,
        passwordHash,
        authProvider: 'email',
        plan: 'free',
      })
      .returning();
    return result[0];
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const now = new Date();
      const created: FallbackUserRecord = {
        id: store.nextUserId++,
        uid: `email_${crypto.randomUUID()}`,
        email: email.toLowerCase(),
        displayName,
        avatarUrl: null,
        passwordHash,
        authProvider: 'email',
        plan: 'free',
        generationsUsed: 0,
        stripeCustomerId: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        createdAt: now,
        updatedAt: now,
      };
      store.users.push(created);
      writeFallbackStore(store);
      return created;
    }
    console.error('Database query failed in createEmailUser:', error);
    throw new Error('Unable to create user account.', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  updates: { displayName?: string; passwordHash?: string }
) {
  try {
    const setPayload: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (updates.displayName) setPayload.displayName = updates.displayName;
    if (updates.passwordHash) setPayload.passwordHash = updates.passwordHash;

    const result = await db
      .update(users)
      .set(setPayload)
      .where(eq(users.uid, uid))
      .returning();
    return result[0] || null;
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const idx = store.users.findIndex((u) => u.uid === uid);
      if (idx < 0) return null;
      if (updates.displayName) store.users[idx].displayName = updates.displayName;
      if (updates.passwordHash) store.users[idx].passwordHash = updates.passwordHash;
      store.users[idx].updatedAt = new Date();
      writeFallbackStore(store);
      return store.users[idx];
    }
    console.error('Database query failed in updateUserProfile:', error);
    throw new Error('Unable to update user profile.', { cause: error });
  }
}

export async function updateUserPlan(
  uid: string,
  plan: 'free' | 'pro' | 'business',
  stripeCustomerId?: string
) {
  try {
    const setPayload: Partial<typeof users.$inferInsert> = {
      plan,
      updatedAt: new Date(),
    };
    if (stripeCustomerId) setPayload.stripeCustomerId = stripeCustomerId;

    const result = await db
      .update(users)
      .set(setPayload)
      .where(eq(users.uid, uid))
      .returning();
    return result[0] || null;
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const idx = store.users.findIndex((u) => u.uid === uid);
      if (idx < 0) return null;
      store.users[idx].plan = plan;
      if (stripeCustomerId) store.users[idx].stripeCustomerId = stripeCustomerId;
      store.users[idx].updatedAt = new Date();
      writeFallbackStore(store);
      return store.users[idx];
    }
    console.error('Database query failed in updateUserPlan:', error);
    throw new Error('Unable to update subscription plan.', { cause: error });
  }
}

export async function incrementUserGenerations(uid: string) {
  try {
    const result = await db
      .update(users)
      .set({
        generationsUsed: sql`${users.generationsUsed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();
    return result[0] || null;
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const idx = store.users.findIndex((u) => u.uid === uid);
      if (idx < 0) return null;
      store.users[idx].generationsUsed += 1;
      store.users[idx].updatedAt = new Date();
      writeFallbackStore(store);
      return store.users[idx];
    }
    console.error('Database query failed in incrementUserGenerations:', error);
    throw new Error('Unable to update usage count.', { cause: error });
  }
}

export async function savePasswordResetToken(
  email: string,
  tokenHash: string,
  expiresAt: Date
) {
  try {
    const result = await db
      .update(users)
      .set({
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email.toLowerCase()))
      .returning();
    return result[0] || null;
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const idx = store.users.findIndex((u) => u.email === email.toLowerCase());
      if (idx < 0) return null;
      store.users[idx].resetTokenHash = tokenHash;
      store.users[idx].resetTokenExpiresAt = expiresAt;
      store.users[idx].updatedAt = new Date();
      writeFallbackStore(store);
      return store.users[idx];
    }
    console.error('Database query failed in savePasswordResetToken:', error);
    throw new Error('Unable to initiate password reset.', { cause: error });
  }
}

export async function resetPasswordWithToken(
  email: string,
  tokenHash: string,
  newPasswordHash: string
) {
  try {
    const existing = await findUserByEmail(email);
    if (
      !existing ||
      !existing.resetTokenHash ||
      !existing.resetTokenExpiresAt ||
      existing.resetTokenExpiresAt.getTime() < Date.now()
    ) {
      return null;
    }

    const a = Buffer.from(existing.resetTokenHash);
    const b = Buffer.from(tokenHash);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const result = await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();
    return result[0] || null;
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const idx = store.users.findIndex((u) => u.email === email.toLowerCase());
      if (idx < 0) return null;
      const existing = store.users[idx];
      if (
        !existing.resetTokenHash ||
        !existing.resetTokenExpiresAt ||
        existing.resetTokenExpiresAt.getTime() < Date.now()
      ) {
        return null;
      }
      const a = Buffer.from(existing.resetTokenHash);
      const b = Buffer.from(tokenHash);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return null;
      }
      store.users[idx].passwordHash = newPasswordHash;
      store.users[idx].resetTokenHash = null;
      store.users[idx].resetTokenExpiresAt = null;
      store.users[idx].updatedAt = new Date();
      writeFallbackStore(store);
      return store.users[idx];
    }
    console.error('Database query failed in resetPasswordWithToken:', error);
    throw new Error('Unable to reset password.', { cause: error });
  }
}

export async function listUserPresentations(userId: number) {
  try {
    return await db
      .select()
      .from(presentations)
      .where(eq(presentations.userId, userId))
      .orderBy(desc(presentations.updatedAt));
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      return store.presentations
        .filter((p) => p.userId === userId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    console.error('Database query failed in listUserPresentations:', error);
    throw new Error('Unable to load presentations.', { cause: error });
  }
}

export async function getPresentationByPublicId(publicId: string) {
  try {
    const result = await db
      .select()
      .from(presentations)
      .where(eq(presentations.publicId, publicId))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      return store.presentations.find((p) => p.publicId === publicId) || null;
    }
    console.error('Database query failed in getPresentationByPublicId:', error);
    throw new Error('Unable to fetch presentation.', { cause: error });
  }
}

export async function createPresentation(
  userId: number,
  data: {
    publicId?: string;
    title: string;
    subtitle?: string;
    presentationType?: string;
    themeId?: string;
    slides: Slide[];
  }
) {
  try {
    const publicId = data.publicId || crypto.randomUUID().slice(0, 12);
    const result = await db
      .insert(presentations)
      .values({
        publicId,
        userId,
        title: data.title,
        subtitle: data.subtitle || '',
        presentationType: data.presentationType || 'Startup Pitch Deck',
        themeId: data.themeId || 'cobalt-studio',
        slidesJson: data.slides,
      })
      .returning();
    return result[0];
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const now = new Date();
      const created: FallbackPresentationRecord = {
        id: store.nextPresentationId++,
        publicId: data.publicId || crypto.randomUUID().slice(0, 12),
        userId,
        title: data.title,
        subtitle: data.subtitle || '',
        presentationType: data.presentationType || 'Startup Pitch Deck',
        themeId: data.themeId || 'cobalt-studio',
        isFavorite: false,
        isPublic: false,
        slidesJson: data.slides,
        googleSlidesId: null,
        googleSlidesUrl: null,
        createdAt: now,
        updatedAt: now,
      };
      store.presentations.push(created);
      writeFallbackStore(store);
      return created;
    }
    console.error('Database query failed in createPresentation:', error);
    throw new Error('Unable to save presentation.', { cause: error });
  }
}

export async function updatePresentation(
  publicId: string,
  userId: number,
  patch: {
    title?: string;
    subtitle?: string;
    presentationType?: string;
    themeId?: string;
    isFavorite?: boolean;
    isPublic?: boolean;
    slides?: Slide[];
    googleSlidesId?: string | null;
    googleSlidesUrl?: string | null;
  }
) {
  try {
    const setPayload: Partial<typeof presentations.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (patch.title !== undefined) setPayload.title = patch.title;
    if (patch.subtitle !== undefined) setPayload.subtitle = patch.subtitle;
    if (patch.presentationType !== undefined) setPayload.presentationType = patch.presentationType;
    if (patch.themeId !== undefined) setPayload.themeId = patch.themeId;
    if (patch.isFavorite !== undefined) setPayload.isFavorite = patch.isFavorite;
    if (patch.isPublic !== undefined) setPayload.isPublic = patch.isPublic;
    if (patch.slides !== undefined) setPayload.slidesJson = patch.slides;
    if (patch.googleSlidesId !== undefined) setPayload.googleSlidesId = patch.googleSlidesId;
    if (patch.googleSlidesUrl !== undefined) setPayload.googleSlidesUrl = patch.googleSlidesUrl;

    const result = await db
      .update(presentations)
      .set(setPayload)
      .where(and(eq(presentations.publicId, publicId), eq(presentations.userId, userId)))
      .returning();
    return result[0] || null;
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const idx = store.presentations.findIndex(
        (p) => p.publicId === publicId && p.userId === userId
      );
      if (idx < 0) return null;
      const target = store.presentations[idx];
      if (patch.title !== undefined) target.title = patch.title;
      if (patch.subtitle !== undefined) target.subtitle = patch.subtitle;
      if (patch.presentationType !== undefined) target.presentationType = patch.presentationType;
      if (patch.themeId !== undefined) target.themeId = patch.themeId;
      if (patch.isFavorite !== undefined) target.isFavorite = patch.isFavorite;
      if (patch.isPublic !== undefined) target.isPublic = patch.isPublic;
      if (patch.slides !== undefined) target.slidesJson = patch.slides;
      target.updatedAt = new Date();
      writeFallbackStore(store);
      return target;
    }
    console.error('Database query failed in updatePresentation:', error);
    throw new Error('Unable to update presentation.', { cause: error });
  }
}

export async function deletePresentation(publicId: string, userId: number) {
  try {
    const result = await db
      .delete(presentations)
      .where(and(eq(presentations.publicId, publicId), eq(presentations.userId, userId)))
      .returning();
    return result[0] || null;
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const idx = store.presentations.findIndex(
        (p) => p.publicId === publicId && p.userId === userId
      );
      if (idx < 0) return null;
      const [removed] = store.presentations.splice(idx, 1);
      writeFallbackStore(store);
      return removed;
    }
    console.error('Database query failed in deletePresentation:', error);
    throw new Error('Unable to delete presentation.', { cause: error });
  }
}

export async function duplicatePresentation(publicId: string, userId: number) {
  try {
    const existing = await db
      .select()
      .from(presentations)
      .where(and(eq(presentations.publicId, publicId), eq(presentations.userId, userId)))
      .limit(1);
    if (!existing[0]) return null;

    const source = existing[0];
    const newPublicId = crypto.randomUUID().slice(0, 12);
    const result = await db
      .insert(presentations)
      .values({
        publicId: newPublicId,
        userId,
        title: `${source.title} (Copy)`,
        subtitle: source.subtitle,
        presentationType: source.presentationType,
        themeId: source.themeId,
        isFavorite: false,
        isPublic: false,
        slidesJson: source.slidesJson,
      })
      .returning();
    return result[0];
  } catch (error) {
    if (isDbSocketUnavailable(error)) {
      const store = readFallbackStore();
      const source = store.presentations.find(
        (p) => p.publicId === publicId && p.userId === userId
      );
      if (!source) return null;
      const now = new Date();
      const copy: FallbackPresentationRecord = {
        ...source,
        id: store.nextPresentationId++,
        publicId: crypto.randomUUID().slice(0, 12),
        title: `${source.title} (Copy)`,
        isFavorite: false,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      };
      store.presentations.push(copy);
      writeFallbackStore(store);
      return copy;
    }
    console.error('Database query failed in duplicatePresentation:', error);
    throw new Error('Unable to duplicate presentation.', { cause: error });
  }
}
