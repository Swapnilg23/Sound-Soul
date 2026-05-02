import { Router } from "express";
import { db } from "@workspace/db";
import { creatorProfilesTable, tracksTable, followsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
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
