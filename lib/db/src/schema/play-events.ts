import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { tracksTable } from "./tracks";

export const playEventsTable = pgTable("play_events", {
  id: text("id").primaryKey(),
  trackId: text("track_id").notNull().references(() => tracksTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
