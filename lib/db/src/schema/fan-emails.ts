import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { creatorProfilesTable } from "./creator-profiles";
import { tracksTable } from "./tracks";

export const fanEmailsTable = pgTable("fan_emails", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => creatorProfilesTable.id),
  trackId: text("track_id").references(() => tracksTable.id),
  email: text("email").notNull(),
  source: text("source"),
  consent: boolean("consent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FanEmail = typeof fanEmailsTable.$inferSelect;
