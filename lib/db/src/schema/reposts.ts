import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { tracksTable } from "./tracks";
import { usersTable } from "./users";

export const repostsTable = pgTable("reposts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  trackId: text("track_id").notNull().references(() => tracksTable.id, { onDelete: "cascade" }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  uniqueUserTrack: unique().on(table.userId, table.trackId),
}));
