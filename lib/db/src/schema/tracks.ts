import { pgTable, text, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { creatorProfilesTable } from "./creator-profiles";

export const tracksTable = pgTable("tracks", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => creatorProfilesTable.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  audioUrl: text("audio_url"),
  coverImageUrl: text("cover_image_url"),
  genre: text("genre"),
  moodTags: text("mood_tags").array(),
  soulStory: text("soul_story"),
  aiInvolvementType: text("ai_involvement_type"),
  humanContributionChecklist: jsonb("human_contribution_checklist"),
  rightsConfirmation: jsonb("rights_confirmation"),
  visibility: text("visibility", { enum: ["draft", "public", "unlisted"] }).notNull().default("draft"),
  moderationStatus: text("moderation_status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  isFeatured: boolean("is_featured").notNull().default(false),
  playCount: integer("play_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  saveCount: integer("save_count").notNull().default(0),
  reportCount: integer("report_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrackSchema = createInsertSchema(tracksTable).omit({ createdAt: true, updatedAt: true, playCount: true, likeCount: true, saveCount: true, reportCount: true });
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracksTable.$inferSelect;
