import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { Slide } from '../types/deck';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull().default('Creator'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  authProvider: text('auth_provider').notNull().default('google'),
  plan: text('plan').notNull().default('free'),
  generationsUsed: integer('generations_used').notNull().default(0),
  stripeCustomerId: text('stripe_customer_id'),
  resetTokenHash: text('reset_token_hash'),
  resetTokenExpiresAt: timestamp('reset_token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const presentations = pgTable('presentations', {
  id: serial('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  presentationType: text('presentation_type').notNull().default('Startup Pitch Deck'),
  themeId: text('theme_id').notNull().default('cobalt-studio'),
  isFavorite: boolean('is_favorite').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(false),
  slidesJson: jsonb('slides_json').$type<Slide[]>().notNull(),
  googleSlidesId: text('google_slides_id'),
  googleSlidesUrl: text('google_slides_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  presentations: many(presentations),
}));

export const presentationsRelations = relations(presentations, ({ one }) => ({
  owner: one(users, {
    fields: [presentations.userId],
    references: [users.id],
  }),
}));
