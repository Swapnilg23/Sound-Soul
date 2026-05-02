import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { tracksTable } from "./tracks";
import { usersTable } from "./users";

export const commentsTable = pgTable("comments", {
  id: text("id").primaryKey(),
  trackId: text("track_id").notNull().references(() => tracksTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
