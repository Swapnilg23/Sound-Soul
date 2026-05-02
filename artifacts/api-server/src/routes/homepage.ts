import { Router } from "express";
import { db } from "@workspace/db";
import { tracksTable, creatorProfilesTable, followsTable } from "@workspace/db";
import { eq, and, desc, sql, count } from "drizzle-orm";

const router = Router();

const APPROVED_PUBLIC = [
  eq(tracksTable.visibility, "public"),
  eq(tracksTable.moderationStatus, "approved"),
];

function fmt(t: any, c: any) {
  return {
    id: t.id, title: t.title, slug: t.slug,
    audioUrl: t.audioUrl,
    coverImageUrl: t.coverImageUrl, genre: t.genre,
    moodTags: t.moodTags, soulStory: t.soulStory,
    aiInvolvementType: t.aiInvolvementType,
    playCount: t.playCount, likeCount: t.likeCount,
    saveCount: t.saveCount, isFeatured: t.isFeatured,
    createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
    creator: c ? {
      id: c.id, artistName: c.artistName, slug: c.slug,
      avatarUrl: c.avatarUrl, bannerUrl: c.bannerUrl,
      bio: c.bio, creatorStatement: c.creatorStatement,
      genres: c.genres, aiToolsUsed: c.aiToolsUsed,
    } : null,
  };
}

router.get("/", async (_req, res) => {
  // Run all four queries in parallel
  const [spotlightRows, weeklyWaveRows, dailyDropRows, todaysPickRows] = await Promise.all([

    // Spotlight: creator with highest total plays, fetch their top track too
    db.select({
      creator: creatorProfilesTable,
      totalPlays: sql<number>`SUM(${tracksTable.playCount})`.as("totalPlays"),
      trackCount: sql<number>`COUNT(${tracksTable.id})`.as("trackCount"),
    })
      .from(creatorProfilesTable)
      .leftJoin(tracksTable, and(
        eq(tracksTable.creatorId, creatorProfilesTable.id),
        ...APPROVED_PUBLIC,
      ))
      .groupBy(creatorProfilesTable.id)
      .orderBy(desc(sql`SUM(${tracksTable.playCount})`))
      .limit(5),

    // Weekly Wave: top tracks by play count
    db.select({ track: tracksTable, creator: creatorProfilesTable })
      .from(tracksTable)
      .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
      .where(and(...APPROVED_PUBLIC))
      .orderBy(desc(tracksTable.playCount))
      .limit(8),

    // Daily Drops: most recently published tracks
    db.select({ track: tracksTable, creator: creatorProfilesTable })
      .from(tracksTable)
      .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
      .where(and(...APPROVED_PUBLIC))
      .orderBy(desc(tracksTable.createdAt))
      .limit(8),

    // Today's Pick: highest (likeCount * 3 + playCount) with a soul story
    db.select({ track: tracksTable, creator: creatorProfilesTable })
      .from(tracksTable)
      .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
      .where(and(...APPROVED_PUBLIC))
      .orderBy(desc(sql`${tracksTable.likeCount} * 3 + ${tracksTable.playCount}`))
      .limit(6),
  ]);

  // Pick best spotlight creator (has tracks)
  const spotlightCreator = spotlightRows.find(r => Number(r.trackCount) > 0)?.creator ?? spotlightRows[0]?.creator ?? null;

  // Get spotlight creator's top track
  let spotlightTopTrack = null;
  if (spotlightCreator) {
    const [topTrackRow] = await db.select({ track: tracksTable })
      .from(tracksTable)
      .where(and(...APPROVED_PUBLIC, eq(tracksTable.creatorId, spotlightCreator.id)))
      .orderBy(desc(tracksTable.playCount))
      .limit(1);
    if (topTrackRow) spotlightTopTrack = fmt(topTrackRow.track, spotlightCreator);
  }

  // Get spotlight follower count
  let spotlightFollowers = 0;
  if (spotlightCreator) {
    const [fc] = await db.select({ n: count() }).from(followsTable).where(eq(followsTable.creatorId, spotlightCreator.id));
    spotlightFollowers = Number(fc?.n ?? 0);
  }

  // Today's pick — prefer one with a soul story
  const todaysPickRaw = todaysPickRows.find(r => r.track.soulStory && r.track.soulStory.length > 10) ?? todaysPickRows[0];

  res.json({
    spotlight: spotlightCreator ? {
      id: spotlightCreator.id,
      artistName: spotlightCreator.artistName,
      slug: spotlightCreator.slug,
      avatarUrl: spotlightCreator.avatarUrl,
      bannerUrl: spotlightCreator.bannerUrl,
      bio: spotlightCreator.bio,
      creatorStatement: spotlightCreator.creatorStatement,
      genres: spotlightCreator.genres,
      aiToolsUsed: spotlightCreator.aiToolsUsed,
      followerCount: spotlightFollowers,
      topTrack: spotlightTopTrack,
    } : null,
    todaysPick: todaysPickRaw ? fmt(todaysPickRaw.track, todaysPickRaw.creator) : null,
    dailyDrops: dailyDropRows.map(r => fmt(r.track, r.creator)),
    weeklyWave: weeklyWaveRows.map(r => fmt(r.track, r.creator)),
  });
});

export default router;
