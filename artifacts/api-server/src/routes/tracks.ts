import { Router } from "express";
import { db } from "@workspace/db";
import {
  tracksTable, creatorProfilesTable, likesTable, savesTable, playEventsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireCreator, requireAuth, optionalAuth } from "../lib/auth";
import { generateId, generateSlug } from "../lib/id";
import commentsRouter from "./comments";

const router = Router();

router.use("/:slug/comments", commentsRouter);

// Get creator's own tracks
router.get("/", requireCreator, async (req, res) => {
  const user = (req as any).user;
  const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);
  if (!profile) return res.json([]);

  const tracks = await db.select().from(tracksTable)
    .where(eq(tracksTable.creatorId, profile.id))
    .orderBy(tracksTable.createdAt);

  res.json(tracks.map(t => formatTrack(t, profile)));
});

// Create track
router.post("/", requireCreator, async (req, res) => {
  const user = (req as any).user;
  const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);
  if (!profile) return res.status(400).json({ error: "Complete creator onboarding first" });

  // Check free tier limit (3 public tracks)
  if (req.body.visibility === "public") {
    const publicCount = await db.select().from(tracksTable).where(
      and(eq(tracksTable.creatorId, profile.id), eq(tracksTable.visibility, "public"))
    );
    if (publicCount.length >= 3) {
      return res.status(400).json({ error: "Free tier limit: maximum 3 public tracks. Join Pro to publish more." });
    }
  }

  const {
    title, description, audioUrl, coverImageUrl, genre, moodTags,
    soulStory, aiInvolvementType, humanContributionChecklist, rightsConfirmation, visibility,
  } = req.body;

  if (!title || !audioUrl) {
    return res.status(400).json({ error: "Title and audio URL are required" });
  }

  // Rights must be confirmed for public submissions
  if (visibility === "public" && (!rightsConfirmation || Object.values(rightsConfirmation).some(v => !v))) {
    return res.status(400).json({ error: "All rights confirmations must be completed before public submission" });
  }

  let slug = generateSlug(title);
  const slugExists = await db.select().from(tracksTable).where(eq(tracksTable.slug, slug)).limit(1);
  if (slugExists[0]) {
    slug = `${slug}-${generateId().substring(0, 6)}`;
  }

  const moderationStatus = visibility === "public" ? "pending" : "approved";

  const [track] = await db.insert(tracksTable).values({
    id: generateId(),
    creatorId: profile.id,
    title,
    slug,
    description,
    audioUrl,
    coverImageUrl,
    genre,
    moodTags,
    soulStory,
    aiInvolvementType,
    humanContributionChecklist,
    rightsConfirmation,
    visibility: visibility || "draft",
    moderationStatus,
  }).returning();

  res.status(201).json(formatTrack(track, profile));
});

// Get track by slug (public)
router.get("/:slug", optionalAuth, async (req, res) => {
  const currentUser = (req as any).user;
  const [track] = await db.select().from(tracksTable).where(eq(tracksTable.slug, req.params.slug)).limit(1);

  if (!track) return res.status(404).json({ error: "Track not found" });

  // Access control
  const isOwner = currentUser && await isTrackOwner(currentUser.id, track.creatorId);
  if (track.visibility === "draft" && !isOwner && currentUser?.role !== "admin") {
    return res.status(404).json({ error: "Track not found" });
  }
  if (track.visibility === "public" && track.moderationStatus !== "approved" && !isOwner && currentUser?.role !== "admin") {
    return res.status(404).json({ error: "Track not found" });
  }

  const [creator] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.id, track.creatorId)).limit(1);

  let isLiked = false;
  let isSaved = false;
  if (currentUser) {
    const liked = await db.select().from(likesTable).where(and(eq(likesTable.userId, currentUser.id), eq(likesTable.trackId, track.id))).limit(1);
    const saved = await db.select().from(savesTable).where(and(eq(savesTable.userId, currentUser.id), eq(savesTable.trackId, track.id))).limit(1);
    isLiked = !!liked[0];
    isSaved = !!saved[0];
  }

  res.json({ ...formatTrack(track, creator), isLiked, isSaved });
});

// Update track
router.patch("/:slug", requireCreator, async (req, res) => {
  const user = (req as any).user;
  const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);
  if (!profile) return res.status(404).json({ error: "Creator profile not found" });

  const [track] = await db.select().from(tracksTable)
    .where(and(eq(tracksTable.slug, req.params.slug), eq(tracksTable.creatorId, profile.id)))
    .limit(1);

  if (!track) return res.status(404).json({ error: "Track not found" });

  const {
    title, description, audioUrl, coverImageUrl, genre, moodTags,
    soulStory, aiInvolvementType, humanContributionChecklist, rightsConfirmation, visibility,
  } = req.body;

  const newVisibility = visibility ?? track.visibility;
  const newModerationStatus = newVisibility === "public" && track.visibility !== "public"
    ? "pending"
    : track.moderationStatus;

  const [updated] = await db.update(tracksTable).set({
    title: title ?? track.title,
    description: description ?? track.description,
    audioUrl: audioUrl ?? track.audioUrl,
    coverImageUrl: coverImageUrl ?? track.coverImageUrl,
    genre: genre ?? track.genre,
    moodTags: moodTags ?? track.moodTags,
    soulStory: soulStory ?? track.soulStory,
    aiInvolvementType: aiInvolvementType ?? track.aiInvolvementType,
    humanContributionChecklist: humanContributionChecklist ?? track.humanContributionChecklist,
    rightsConfirmation: rightsConfirmation ?? track.rightsConfirmation,
    visibility: newVisibility,
    moderationStatus: newModerationStatus,
    updatedAt: new Date(),
  }).where(eq(tracksTable.id, track.id)).returning();

  res.json(formatTrack(updated, profile));
});

// Delete track
router.delete("/:slug", requireCreator, async (req, res) => {
  const user = (req as any).user;
  const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);
  if (!profile) return res.status(404).json({ error: "Creator profile not found" });

  const [track] = await db.select().from(tracksTable)
    .where(and(eq(tracksTable.slug, req.params.slug), eq(tracksTable.creatorId, profile.id)))
    .limit(1);

  if (!track) return res.status(404).json({ error: "Track not found" });

  await db.delete(tracksTable).where(eq(tracksTable.id, track.id));

  res.json({ message: "Track deleted" });
});

// Increment play count and record play event
router.post("/:slug/play", async (req, res) => {
  const [track] = await db.select().from(tracksTable).where(eq(tracksTable.slug, req.params.slug)).limit(1);
  if (!track) return res.status(404).json({ error: "Track not found" });

  await Promise.all([
    db.update(tracksTable)
      .set({ playCount: sql`${tracksTable.playCount} + 1` })
      .where(eq(tracksTable.id, track.id)),
    db.insert(playEventsTable).values({ id: generateId(), trackId: track.id }),
  ]);

  res.json({ message: "Play count incremented" });
});

async function isTrackOwner(userId: string, creatorId: string): Promise<boolean> {
  const [profile] = await db.select().from(creatorProfilesTable)
    .where(and(eq(creatorProfilesTable.userId, userId), eq(creatorProfilesTable.id, creatorId)))
    .limit(1);
  return !!profile;
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
