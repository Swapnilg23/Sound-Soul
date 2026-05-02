import { pgTable, text, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { tracksTable } from "./tracks";

export const soulStoriesTable = pgTable("soul_stories", {
  id: text("id").primaryKey(),
  trackId: text("track_id").notNull().references(() => tracksTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.trackId, t.userId)]);

export type SoulStory = typeof soulStoriesTable.$inferSelect;
