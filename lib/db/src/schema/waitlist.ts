import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const proWaitlistTable = pgTable("pro_waitlist", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => usersTable.id),
  email: text("email").notNull(),
  desiredPlan: text("desired_plan", { enum: ["pro", "studio"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProWaitlist = typeof proWaitlistTable.$inferSelect;
