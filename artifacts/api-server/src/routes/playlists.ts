import { Router } from "express";
import { db } from "@workspace/db";
import {
  playlistsTable, playlistTracksTable, tracksTable, creatorProfilesTable, usersTable,
} from "@workspace/db";
import { eq, and, asc, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { generateId } from "../lib/id";

const router = Router();

function generateSlug(title: string, suffix: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + suffix.slice(-6);
}

function fmtPlaylist(p: any, tracks: any[] = [], owner?: any) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    coverImageUrl: p.coverImageUrl ?? tracks[0]?.coverImageUrl ?? null,
    isPublic: p.isPublic,
    trackCount: tracks.length,
    createdAt: p.createdAt,
    owner: owner ? { displayName: owner.displayName ?? owner.email.split("@")[0], avatarUrl: null } : undefined,
    tracks,
  };
}

function fmtTrack(t: any, profile: any) {
  return {
    id: t.id,
    title: t.title,
    slug: t.slug,
    genre: t.genre,
    audioUrl: t.audioUrl,
    coverImageUrl: t.coverImageUrl,
    playCount: t.playCount,
    creator: { artistName: profile?.artistName ?? "Unknown", slug: profile?.slug ?? "", avatarUrl: profile?.avatarUrl ?? null },
  };
}

// GET /api/playlists — list my playlists
router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const lists = await db.select().from(playlistsTable).where(eq(playlistsTable.userId, user.id)).orderBy(playlistsTable.createdAt);

  const withCounts = await Promise.all(lists.map(async (p) => {
    const pts = await db.select().from(playlistTracksTable).where(eq(playlistTracksTable.playlistId, p.id));
    if (pts.length === 0) return fmtPlaylist(p, []);
    const [firstTrack] = await db.select().from(tracksTable).where(eq(tracksTable.id, pts[0].trackId)).limit(1);
    return fmtPlaylist(p, pts.map(pt => ({ id: pt.trackId })), undefined);
  }));

  res.json({ playlists: withCounts });
});

// POST /api/playlists — create
router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { title, description, isPublic = true } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Title required" });

  const id = generateId();
  const slug = generateSlug(title.trim(), id);

  await db.insert(playlistsTable).values({
    id, userId: user.id, title: title.trim(), description: description?.trim() ?? null,
    isPublic: !!isPublic, slug,
    createdAt: new Date(), updatedAt: new Date(),
  });

  const [created] = await db.select().from(playlistsTable).where(eq(playlistsTable.id, id)).limit(1);
  res.status(201).json(fmtPlaylist(created, []));
});

// GET /api/playlists/:slug — public view
router.get("/:slug", async (req, res) => {
  const [playlist] = await db.select().from(playlistsTable)
    .where(eq(playlistsTable.slug, req.params.slug)).limit(1);
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });

  const pts = await db.select().from(playlistTracksTable)
    .where(eq(playlistTracksTable.playlistId, playlist.id))
    .orderBy(asc(playlistTracksTable.position));

  const tracks: any[] = [];
  for (const pt of pts) {
    const [track] = await db.select().from(tracksTable).where(eq(tracksTable.id, pt.trackId)).limit(1);
    if (!track) continue;
    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.id, track.creatorId)).limit(1);
    tracks.push(fmtTrack(track, profile));
  }

  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, playlist.userId)).limit(1);
  res.json(fmtPlaylist(playlist, tracks, owner));
});

// GET /api/playlists/:id/tracks — list tracks (by id, auth)
router.get("/:id/tracks", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [playlist] = await db.select().from(playlistsTable)
    .where(and(eq(playlistsTable.id, req.params.id), eq(playlistsTable.userId, user.id))).limit(1);
  if (!playlist) return res.status(404).json({ error: "Not found" });

  const pts = await db.select().from(playlistTracksTable)
    .where(eq(playlistTracksTable.playlistId, playlist.id))
    .orderBy(asc(playlistTracksTable.position));

  const tracks: any[] = [];
  for (const pt of pts) {
    const [track] = await db.select().from(tracksTable).where(eq(tracksTable.id, pt.trackId)).limit(1);
    if (!track) continue;
    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.id, track.creatorId)).limit(1);
    tracks.push(fmtTrack(track, profile));
  }
  res.json({ tracks });
});

// POST /api/playlists/:id/tracks — add track
router.post("/:id/tracks", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.body;
  if (!trackId) return res.status(400).json({ error: "trackId required" });

  const [playlist] = await db.select().from(playlistsTable)
    .where(and(eq(playlistsTable.id, req.params.id), eq(playlistsTable.userId, user.id))).limit(1);
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });

  const existing = await db.select().from(playlistTracksTable)
    .where(and(eq(playlistTracksTable.playlistId, playlist.id), eq(playlistTracksTable.trackId, trackId))).limit(1);
  if (existing.length > 0) return res.json({ message: "Already in playlist" });

  const count = await db.select({ c: sql<number>`count(*)` })
    .from(playlistTracksTable).where(eq(playlistTracksTable.playlistId, playlist.id));
  const position = Number(count[0]?.c ?? 0);

  await db.insert(playlistTracksTable).values({
    id: generateId(), playlistId: playlist.id, trackId, position, addedAt: new Date(),
  });
  res.status(201).json({ message: "Added" });
});

// DELETE /api/playlists/:id/tracks/:trackId — remove track
router.delete("/:id/tracks/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [playlist] = await db.select().from(playlistsTable)
    .where(and(eq(playlistsTable.id, req.params.id), eq(playlistsTable.userId, user.id))).limit(1);
  if (!playlist) return res.status(404).json({ error: "Not found" });

  await db.delete(playlistTracksTable).where(
    and(eq(playlistTracksTable.playlistId, playlist.id), eq(playlistTracksTable.trackId, req.params.trackId))
  );
  res.json({ message: "Removed" });
});

// DELETE /api/playlists/:id — delete playlist
router.delete("/:id", requireAuth, async (req, res) => {
  const user = (req as any).user;
  await db.delete(playlistsTable).where(
    and(eq(playlistsTable.id, req.params.id), eq(playlistsTable.userId, user.id))
  );
  res.json({ message: "Deleted" });
});

export default router;
