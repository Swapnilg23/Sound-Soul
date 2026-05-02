import { Router } from "express";
import { db } from "@workspace/db";
import { tracksTable, creatorProfilesTable } from "@workspace/db";
import { eq, and, or, ilike, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { search, mood, genre, aiInvolvement, featured, limit = 20, offset = 0 } = req.query;

  const conditions: any[] = [
    eq(tracksTable.visibility, "public"),
    eq(tracksTable.moderationStatus, "approved"),
  ];

  if (featured === "true") {
    conditions.push(eq(tracksTable.isFeatured, true));
  }

  if (genre) {
    conditions.push(eq(tracksTable.genre, genre as string));
  }

  if (aiInvolvement) {
    conditions.push(eq(tracksTable.aiInvolvementType, aiInvolvement as string));
  }

  const tracks = await db.select({
    track: tracksTable,
    creator: creatorProfilesTable,
  })
    .from(tracksTable)
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(and(...conditions))
    .orderBy(tracksTable.createdAt)
    .limit(Number(limit))
    .offset(Number(offset));

  // Filter by mood (array contains) and search in JS since complex SQL is tricky
  let results = tracks;

  if (mood) {
    results = results.filter(r => r.track.moodTags?.includes(mood as string));
  }

  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(r =>
      r.track.title.toLowerCase().includes(q) ||
      r.creator?.artistName?.toLowerCase().includes(q) ||
      r.track.genre?.toLowerCase().includes(q)
    );
  }

  const total = results.length;
  const paginated = results.slice(0, Number(limit));

  res.json({
    tracks: paginated.map(r => formatTrackWithCreator(r.track, r.creator)),
    total,
  });
});

router.get("/curated", async (req, res) => {
  const approvedPublic = [eq(tracksTable.visibility, "public"), eq(tracksTable.moderationStatus, "approved")];

  const fetchByMood = async (mood: string, lim = 6) => {
    const rows = await db.select({ track: tracksTable, creator: creatorProfilesTable })
      .from(tracksTable)
      .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
      .where(and(...approvedPublic))
      .orderBy(tracksTable.createdAt)
      .limit(50);
    return rows.filter(r => r.track.moodTags?.includes(mood)).slice(0, lim)
      .map(r => formatTrackWithCreator(r.track, r.creator));
  };

  const fetchFeatured = async () => {
    const rows = await db.select({ track: tracksTable, creator: creatorProfilesTable })
      .from(tracksTable)
      .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
      .where(and(...approvedPublic, eq(tracksTable.isFeatured, true)))
      .orderBy(tracksTable.createdAt)
      .limit(6);
    return rows.map(r => formatTrackWithCreator(r.track, r.creator));
  };

  const fetchLatest = async () => {
    const rows = await db.select({ track: tracksTable, creator: creatorProfilesTable })
      .from(tracksTable)
      .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
      .where(and(...approvedPublic))
      .orderBy(tracksTable.createdAt)
      .limit(8);
    return rows.map(r => formatTrackWithCreator(r.track, r.creator));
  };

  const fetchHumanAi = async () => {
    const rows = await db.select({ track: tracksTable, creator: creatorProfilesTable })
      .from(tracksTable)
      .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
      .where(and(...approvedPublic))
      .orderBy(tracksTable.createdAt)
      .limit(50);
    return rows
      .filter(r => r.track.aiInvolvementType && r.track.aiInvolvementType !== "Human-created, no AI" && r.track.aiInvolvementType !== "Fully AI-generated")
      .slice(0, 6)
      .map(r => formatTrackWithCreator(r.track, r.creator));
  };

  const fetchHiddenGems = async () => {
    const rows = await db.select({ track: tracksTable, creator: creatorProfilesTable })
      .from(tracksTable)
      .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
      .where(and(...approvedPublic, eq(tracksTable.isFeatured, false)))
      .orderBy(tracksTable.createdAt)
      .limit(6);
    return rows.map(r => formatTrackWithCreator(r.track, r.creator));
  };

  const [featured, calmRightNow, hopefulSounds, cinematicAi, humanAiCollaborations, hiddenGems, focusAndFlow, latest] = await Promise.all([
    fetchFeatured(),
    fetchByMood("Calm"),
    fetchByMood("Hopeful"),
    fetchByMood("Cinematic"),
    fetchHumanAi(),
    fetchHiddenGems(),
    fetchByMood("Focus"),
    fetchLatest(),
  ]);

  res.json({ featured, calmRightNow, hopefulSounds, cinematicAi, humanAiCollaborations, hiddenGems, focusAndFlow, latest });
});

function formatTrackWithCreator(t: any, creator: any) {
  return {
    id: t.id,
    creatorId: t.creatorId,
    title: t.title,
    slug: t.slug,
    description: t.description,
    audioUrl: t.audioUrl,
    coverImageUrl: t.coverImageUrl,
    genre: t.genre,
    moodTags: t.moodTags,
    soulStory: t.soulStory,
    aiInvolvementType: t.aiInvolvementType,
    humanContributionChecklist: t.humanContributionChecklist,
    rightsConfirmation: t.rightsConfirmation,
    visibility: t.visibility,
    moderationStatus: t.moderationStatus,
    isFeatured: t.isFeatured,
    playCount: t.playCount,
    likeCount: t.likeCount,
    saveCount: t.saveCount,
    createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
    updatedAt: t.updatedAt?.toISOString?.() ?? t.updatedAt,
    creator: creator ? {
      id: creator.id,
      artistName: creator.artistName,
      slug: creator.slug,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      bannerUrl: creator.bannerUrl,
      genres: creator.genres,
      moodIdentityTags: creator.moodIdentityTags,
      aiToolsUsed: creator.aiToolsUsed,
      socialLinks: creator.socialLinks,
      creatorStatement: creator.creatorStatement,
      createdAt: creator.createdAt?.toISOString?.() ?? creator.createdAt,
    } : null,
  };
}

export default router;
