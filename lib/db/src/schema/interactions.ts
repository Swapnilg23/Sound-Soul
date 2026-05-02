import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { tracksTable } from "./tracks";
import { creatorProfilesTable } from "./creator-profiles";

export const likesTable = pgTable("likes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  trackId: text("track_id").notNull().references(() => tracksTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.userId, t.trackId)]);

export const savesTable = pgTable("saves", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  trackId: text("track_id").notNull().references(() => tracksTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.userId, t.trackId)]);

export const followsTable = pgTable("follows", {
  id: text("id").primaryKey(),
  followerUserId: text("follower_user_id").notNull().references(() => usersTable.id),
  creatorId: text("creator_id").notNull().references(() => creatorProfilesTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.followerUserId, t.creatorId)]);

export type Like = typeof likesTable.$inferSelect;
export type Save = typeof savesTable.$inferSelect;
export type Follow = typeof followsTable.$inferSelect;
