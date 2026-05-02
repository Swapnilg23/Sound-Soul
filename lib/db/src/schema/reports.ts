import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { tracksTable } from "./tracks";

export const reportsTable = pgTable("reports", {
  id: text("id").primaryKey(),
  trackId: text("track_id").notNull().references(() => tracksTable.id),
  reporterEmail: text("reporter_email"),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status", { enum: ["open", "reviewed", "resolved"] }).notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Report = typeof reportsTable.$inferSelect;
