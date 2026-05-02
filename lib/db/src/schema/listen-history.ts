import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { tracksTable } from "./tracks";

export const listenHistoryTable = pgTable("listen_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  trackId: text("track_id").notNull().references(() => tracksTable.id, { onDelete: "cascade" }),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

export type ListenHistory = typeof listenHistoryTable.$inferSelect;
