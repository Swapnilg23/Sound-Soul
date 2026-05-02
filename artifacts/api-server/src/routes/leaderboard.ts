import { Router } from "express";
import { db } from "@workspace/db";
import { tracksTable, creatorProfilesTable, playEventsTable } from "@workspace/db";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { genre, window: win = "all" } = req.query;
  const limit = 25;

  const approvedPublic = [
    eq(tracksTable.visibility, "public"),
    eq(tracksTable.moderationStatus, "approved"),
  ];

  if (win === "all") {
    // Use stored aggregate counts — fast
    const conditions = [...approvedPublic];
    if (genre) conditions.push(eq(tracksTable.genre, genre as string));

    const rows = await db
      .select({ track: tracksTable, creator: creatorProfilesTable })
      .from(tracksTable)
      .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
      .where(and(...conditions))
      .orderBy(desc(tracksTable.playCount))
      .limit(limit);

    return res.json({
      tracks: rows.map(r => formatRow(r.track, r.creator)),
      window: win,
    });
  }

  // Time-windowed: count play_events in the period
  const since = new Date();
  if (win === "7d")  since.setDate(since.getDate() - 7);
  if (win === "30d") since.setDate(since.getDate() - 30);
  if (win === "24h") since.setDate(since.getDate() - 1);

  // Aggregate play events in window per track
  const eventCounts = await db
    .select({
      trackId: playEventsTable.trackId,
      plays: count(playEventsTable.id),
    })
    .from(playEventsTable)
    .where(gte(playEventsTable.createdAt, since))
    .groupBy(playEventsTable.trackId)
    .orderBy(desc(count(playEventsTable.id)))
    .limit(limit * 3); // over-fetch to allow for genre filter

  if (eventCounts.length === 0) return res.json({ tracks: [], window: win });

  // Fetch full track + creator for top track IDs
  const trackIds = eventCounts.map(e => e.trackId);
  const trackConditions = [...approvedPublic];
  if (genre) trackConditions.push(eq(tracksTable.genre, genre as string));

  const rows = await db
    .select({ track: tracksTable, creator: creatorProfilesTable })
    .from(tracksTable)
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(and(...trackConditions));

  // Merge play counts from events and sort
  const rowMap = new Map(rows.map(r => [r.track.id, r]));
  const ranked = eventCounts
    .filter(e => rowMap.has(e.trackId))
    .slice(0, limit)
    .map(e => {
      const r = rowMap.get(e.trackId)!;
      return formatRow(r.track, r.creator, Number(e.plays));
    });

  return res.json({ tracks: ranked, window: win });
});

// Returns distinct genres across published tracks for filter pills
router.get("/genres", async (_req, res) => {
  const rows = await db
    .selectDistinct({ genre: tracksTable.genre })
    .from(tracksTable)
    .where(and(
      eq(tracksTable.visibility, "public"),
      eq(tracksTable.moderationStatus, "approved"),
    ));

  const genres = rows
    .map(r => r.genre)
    .filter(Boolean)
    .sort() as string[];

  res.json({ genres });
});

function formatRow(t: any, creator: any, windowPlays?: number) {
  return {
    id: t.id,
    title: t.title,
    slug: t.slug,
    coverImageUrl: t.coverImageUrl,
    genre: t.genre,
    aiInvolvementType: t.aiInvolvementType,
    playCount: windowPlays ?? t.playCount,
    likeCount: t.likeCount,
    saveCount: t.saveCount,
    createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
    creator: creator ? {
      id: creator.id,
      artistName: creator.artistName,
      slug: creator.slug,
      avatarUrl: creator.avatarUrl,
    } : null,
  };
}

export default router;
