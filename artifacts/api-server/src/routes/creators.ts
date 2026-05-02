import { Router } from "express";
import { db } from "@workspace/db";
import { creatorProfilesTable, tracksTable, followsTable, repostsTable, likesTable, savesTable, commentsTable, usersTable } from "@workspace/db";
import { eq, and, count, desc, inArray } from "drizzle-orm";
import { requireAuth, requireCreator } from "../lib/auth";
import { generateId, generateSlug } from "../lib/id";

const router = Router();

router.post("/onboarding", requireCreator, async (req, res) => {
  const user = (req as any).user;

  const existing = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);
  if (existing[0]) {
    return res.status(400).json({ error: "Creator profile already exists" });
  }

  const {
    artistName, bio, avatarUrl, bannerUrl, genres, moodIdentityTags,
    aiToolsUsed, socialLinks, creatorStatement,
  } = req.body;

  if (!artistName) {
    return res.status(400).json({ error: "Artist name is required" });
  }

  let slug = generateSlug(artistName);
  // Ensure slug uniqueness
  const slugExists = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.slug, slug)).limit(1);
  if (slugExists[0]) {
    slug = `${slug}-${generateId().substring(0, 6)}`;
  }

  const [profile] = await db.insert(creatorProfilesTable).values({
    id: generateId(),
    userId: user.id,
    artistName,
    slug,
    bio,
    avatarUrl,
    bannerUrl,
    genres,
    moodIdentityTags,
    aiToolsUsed,
    socialLinks,
    creatorStatement,
  }).returning();

  res.status(201).json(formatProfile(profile));
});

router.get("/me", requireCreator, async (req, res) => {
  const user = (req as any).user;
  const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);

  if (!profile) {
    return res.status(404).json({ error: "Creator profile not found" });
  }

  res.json(formatProfile(profile));
});

router.patch("/me", requireCreator, async (req, res) => {
  const user = (req as any).user;
  const [existing] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);

  if (!existing) {
    return res.status(404).json({ error: "Creator profile not found" });
  }

  const {
    artistName, bio, avatarUrl, bannerUrl, genres, moodIdentityTags,
    aiToolsUsed, socialLinks, creatorStatement,
  } = req.body;

  const [updated] = await db.update(creatorProfilesTable)
    .set({
      artistName: artistName ?? existing.artistName,
      bio: bio ?? existing.bio,
      avatarUrl: avatarUrl ?? existing.avatarUrl,
      bannerUrl: bannerUrl ?? existing.bannerUrl,
      genres: genres ?? existing.genres,
      moodIdentityTags: moodIdentityTags ?? existing.moodIdentityTags,
      aiToolsUsed: aiToolsUsed ?? existing.aiToolsUsed,
      socialLinks: socialLinks ?? existing.socialLinks,
      creatorStatement: creatorStatement ?? existing.creatorStatement,
      updatedAt: new Date(),
    })
    .where(eq(creatorProfilesTable.id, existing.id))
    .returning();

  res.json(formatProfile(updated));
});

router.get("/:slug", async (req, res) => {
  const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.slug, req.params.slug)).limit(1);

  if (!profile) {
    return res.status(404).json({ error: "Creator not found" });
  }

  const [followerCountResult] = await db.select({ count: count() }).from(followsTable).where(eq(followsTable.creatorId, profile.id));
  const [trackCountResult] = await db.select({ count: count() }).from(tracksTable).where(
    and(eq(tracksTable.creatorId, profile.id), eq(tracksTable.visibility, "public"), eq(tracksTable.moderationStatus, "approved"))
  );

  res.json({
    ...formatProfile(profile),
    followerCount: Number(followerCountResult?.count ?? 0),
    trackCount: Number(trackCountResult?.count ?? 0),
  });
});

router.get("/:slug/tracks", async (req, res) => {
  const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.slug, req.params.slug)).limit(1);

  if (!profile) {
    return res.status(404).json({ error: "Creator not found" });
  }

  const tracks = await db.select().from(tracksTable).where(
    and(eq(tracksTable.creatorId, profile.id), eq(tracksTable.visibility, "public"), eq(tracksTable.moderationStatus, "approved"))
  ).orderBy(tracksTable.createdAt);

  res.json(tracks.map(t => formatTrack(t, profile)));
});

// Activity feed: own releases + reposts, merged and sorted by recency
router.get("/:slug/activity", async (req, res) => {
  const [profile] = await db.select().from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.slug, req.params.slug))
    .limit(1);

  if (!profile) return res.status(404).json({ error: "Creator not found" });

  const approvedPublic = and(
    eq(tracksTable.visibility, "public"),
    eq(tracksTable.moderationStatus, "approved"),
  );

  // Own releases
  const ownTracks = await db.select().from(tracksTable)
    .where(and(eq(tracksTable.creatorId, profile.id), approvedPublic!))
    .orderBy(desc(tracksTable.createdAt))
    .limit(20);

  // Reposts by this creator (via their userId)
  const repostRows = await db
    .select({ repost: repostsTable, track: tracksTable, creator: creatorProfilesTable })
    .from(repostsTable)
    .leftJoin(tracksTable, eq(repostsTable.trackId, tracksTable.id))
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(and(eq(repostsTable.userId, profile.userId), approvedPublic!))
    .orderBy(desc(repostsTable.createdAt))
    .limit(20);

  // Merge & sort
  const releases = ownTracks.map(t => ({
    type: "release" as const,
    sortDate: t.createdAt?.toISOString?.() ?? t.createdAt,
    track: formatTrack(t, profile),
  }));

  const reposts = repostRows
    .filter(r => r.track)
    .map(r => ({
      type: "repost" as const,
      sortDate: r.repost.createdAt?.toISOString?.() ?? r.repost.createdAt,
      repostedAt: r.repost.createdAt?.toISOString?.() ?? r.repost.createdAt,
      track: formatTrack(r.track!, r.creator),
    }));

  const merged = [...releases, ...reposts]
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
    .slice(0, 30);

  res.json({ activity: merged });
});

// Top Fans: users with the most engagement on this creator's tracks
router.get("/:slug/top-fans", async (req, res) => {
  const [profile] = await db.select().from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.slug, req.params.slug))
    .limit(1);

  if (!profile) return res.status(404).json({ error: "Creator not found" });

  // Get all approved public track IDs for this creator
  const creatorTracks = await db.select({ id: tracksTable.id })
    .from(tracksTable)
    .where(and(
      eq(tracksTable.creatorId, profile.id),
      eq(tracksTable.visibility, "public"),
      eq(tracksTable.moderationStatus, "approved"),
    ));

  if (creatorTracks.length === 0) return res.json({ fans: [] });

  const trackIds = creatorTracks.map(t => t.id);

  // Count likes, saves, comments per user in parallel
  const [likeCounts, saveCounts, commentCounts] = await Promise.all([
    db.select({ userId: likesTable.userId, n: count() })
      .from(likesTable)
      .where(inArray(likesTable.trackId, trackIds))
      .groupBy(likesTable.userId),
    db.select({ userId: savesTable.userId, n: count() })
      .from(savesTable)
      .where(inArray(savesTable.trackId, trackIds))
      .groupBy(savesTable.userId),
    db.select({ userId: commentsTable.userId, n: count() })
      .from(commentsTable)
      .where(inArray(commentsTable.trackId, trackIds))
      .groupBy(commentsTable.userId),
  ]);

  // Score: like=1pt, save=2pt, comment=3pt
  const scores: Record<string, { likes: number; saves: number; comments: number; score: number }> = {};
  for (const { userId, n } of likeCounts) {
    if (!scores[userId]) scores[userId] = { likes: 0, saves: 0, comments: 0, score: 0 };
    scores[userId].likes = Number(n);
    scores[userId].score += Number(n) * 1;
  }
  for (const { userId, n } of saveCounts) {
    if (!scores[userId]) scores[userId] = { likes: 0, saves: 0, comments: 0, score: 0 };
    scores[userId].saves = Number(n);
    scores[userId].score += Number(n) * 2;
  }
  for (const { userId, n } of commentCounts) {
    if (!scores[userId]) scores[userId] = { likes: 0, saves: 0, comments: 0, score: 0 };
    scores[userId].comments = Number(n);
    scores[userId].score += Number(n) * 3;
  }

  // Exclude the creator themselves
  delete scores[profile.userId];

  const topUserIds = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 8)
    .map(([uid]) => uid);

  if (topUserIds.length === 0) return res.json({ fans: [] });

  // Fetch user info + optional creator profile
  const [users, creatorProfiles] = await Promise.all([
    db.select().from(usersTable).where(inArray(usersTable.id, topUserIds)),
    db.select().from(creatorProfilesTable).where(inArray(creatorProfilesTable.userId, topUserIds)),
  ]);

  const profileByUserId = new Map(creatorProfiles.map(p => [p.userId, p]));

  const fans = topUserIds.map(uid => {
    const u = users.find(x => x.id === uid);
    const cp = profileByUserId.get(uid);
    const s = scores[uid];
    return {
      userId: uid,
      displayName: cp?.artistName || u?.email?.split("@")[0] || "Listener",
      avatarUrl: cp?.avatarUrl || null,
      profileSlug: cp?.slug || null,
      role: u?.role,
      likes: s.likes,
      saves: s.saves,
      comments: s.comments,
      score: s.score,
    };
  });

  res.json({ fans });
});

function formatProfile(p: any) {
  return {
    id: p.id,
    userId: p.userId,
    artistName: p.artistName,
    slug: p.slug,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    bannerUrl: p.bannerUrl,
    genres: p.genres,
    moodIdentityTags: p.moodIdentityTags,
    aiToolsUsed: p.aiToolsUsed,
    socialLinks: p.socialLinks,
    creatorStatement: p.creatorStatement,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
  };
}

function formatTrack(t: any, creator: any) {
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
    creator: creator ? formatProfile(creator) : null,
  };
}

export default router;
