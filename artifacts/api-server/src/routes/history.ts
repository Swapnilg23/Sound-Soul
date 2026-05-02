import { Router } from "express";
import { db } from "@workspace/db";
import { listenHistoryTable, tracksTable, creatorProfilesTable } from "@workspace/db";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth";
import { generateId } from "../lib/id";

const router = Router();

// POST /api/history — log a play (called by client when track starts)
router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.body;
  if (!trackId) return res.status(400).json({ error: "trackId required" });

  await db.insert(listenHistoryTable).values({
    id: generateId(), userId: user.id, trackId, playedAt: new Date(),
  }).catch(() => {});

  // Trim to last 100 entries per user
  await db.execute(sql`
    DELETE FROM listen_history
    WHERE user_id = ${user.id}
    AND id NOT IN (
      SELECT id FROM listen_history WHERE user_id = ${user.id}
      ORDER BY played_at DESC LIMIT 100
    )
  `).catch(() => {});

  res.status(201).json({ message: "Logged" });
});

// GET /api/history — get last 30 played tracks
router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;

  const rows = await db
    .select()
    .from(listenHistoryTable)
    .where(eq(listenHistoryTable.userId, user.id))
    .orderBy(desc(listenHistoryTable.playedAt))
    .limit(30);

  if (rows.length === 0) return res.json({ tracks: [] });

  const trackIds = [...new Set(rows.map(r => r.trackId))];
  const tracks = await db.select().from(tracksTable)
    .where(inArray(tracksTable.id, trackIds));

  const creatorIds = [...new Set(tracks.map(t => t.creatorId))];
  const profiles = creatorIds.length > 0
    ? await db.select().from(creatorProfilesTable).where(inArray(creatorProfilesTable.id, creatorIds))
    : [];

  const trackMap = Object.fromEntries(tracks.map(t => [t.id, t]));
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

  const result = rows.map(row => {
    const track = trackMap[row.trackId];
    if (!track) return null;
    const profile = profileMap[track.creatorId];
    return {
      id: track.id,
      title: track.title,
      slug: track.slug,
      genre: track.genre,
      audioUrl: track.audioUrl,
      coverImageUrl: track.coverImageUrl,
      playedAt: row.playedAt,
      creator: {
        artistName: profile?.artistName ?? "Unknown",
        slug: profile?.slug ?? "",
        avatarUrl: profile?.avatarUrl ?? null,
      },
    };
  }).filter(Boolean);

  res.json({ tracks: result });
});

export default router;
