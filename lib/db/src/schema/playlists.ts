import { pgTable, text, timestamp, integer, boolean, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { tracksTable } from "./tracks";

export const playlistsTable = pgTable("playlists", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  isPublic: boolean("is_public").notNull().default(true),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const playlistTracksTable = pgTable("playlist_tracks", {
  id: text("id").primaryKey(),
  playlistId: text("playlist_id").notNull().references(() => playlistsTable.id, { onDelete: "cascade" }),
  trackId: text("track_id").notNull().references(() => tracksTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  addedAt: timestamp("added_at").defaultNow().notNull(),
}, (t) => [unique().on(t.playlistId, t.trackId)]);

export type Playlist = typeof playlistsTable.$inferSelect;
export type PlaylistTrack = typeof playlistTracksTable.$inferSelect;
