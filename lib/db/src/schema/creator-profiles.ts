import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const creatorProfilesTable = pgTable("creator_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  artistName: text("artist_name").notNull(),
  slug: text("slug").notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  genres: text("genres").array(),
  moodIdentityTags: text("mood_identity_tags").array(),
  aiToolsUsed: text("ai_tools_used").array(),
  socialLinks: jsonb("social_links"),
  creatorStatement: text("creator_statement"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCreatorProfileSchema = createInsertSchema(creatorProfilesTable).omit({ createdAt: true, updatedAt: true });
export type InsertCreatorProfile = z.infer<typeof insertCreatorProfileSchema>;
export type CreatorProfile = typeof creatorProfilesTable.$inferSelect;
