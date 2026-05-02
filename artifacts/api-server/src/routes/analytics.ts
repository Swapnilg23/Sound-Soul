import { Router } from "express";
import { db } from "@workspace/db";
import {
  tracksTable, creatorProfilesTable, playEventsTable,
} from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireCreator } from "../lib/auth";

const router = Router();

router.get("/tracks", requireCreator, async (req, res) => {
  const user = (req as any).user;

  const [profile] = await db.select().from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.userId, user.id)).limit(1);

  if (!profile) return res.json({ tracks: [] });

  const tracks = await db.select().from(tracksTable)
    .where(eq(tracksTable.creatorId, profile.id))
    .orderBy(tracksTable.createdAt);

  if (tracks.length === 0) return res.json({ tracks: [] });

  const trackIds = tracks.map(t => t.id);

  // Last 8 weeks of play events per track, grouped by week
  const since = new Date();
  since.setDate(since.getDate() - 56);

  const playRows = await db.execute(sql`
    SELECT
      track_id,
      TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') AS week,
      COUNT(*)::int AS plays
    FROM play_events
    WHERE track_id = ANY(${sql.raw(`ARRAY[${trackIds.map(id => `'${id}'`).join(',')}]`)})
      AND created_at >= ${since.toISOString()}
    GROUP BY track_id, DATE_TRUNC('week', created_at)
    ORDER BY week ASC
  `);

  const playsByTrack: Record<string, { week: string; plays: number }[]> = {};
  for (const row of (playRows as any).rows ?? playRows) {
    const r = row as any;
    if (!playsByTrack[r.track_id]) playsByTrack[r.track_id] = [];
    playsByTrack[r.track_id].push({ week: r.week, plays: Number(r.plays) });
  }

  const result = tracks.map(t => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    coverImageUrl: t.coverImageUrl,
    genre: t.genre,
    moderationStatus: t.moderationStatus,
    visibility: t.visibility,
    playCount: t.playCount,
    likeCount: t.likeCount,
    saveCount: t.saveCount,
    weeklyPlays: playsByTrack[t.id] ?? [],
  }));

  res.json({ tracks: result });
});

export default router;
