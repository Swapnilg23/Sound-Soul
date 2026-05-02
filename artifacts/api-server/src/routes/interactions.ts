import { Router } from "express";
import { db } from "@workspace/db";
import {
  likesTable, savesTable, followsTable, tracksTable, creatorProfilesTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { generateId } from "../lib/id";

const router = Router();

// Like track
router.post("/likes/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.params;

  const existing = await db.select().from(likesTable).where(and(eq(likesTable.userId, user.id), eq(likesTable.trackId, trackId))).limit(1);
  if (existing[0]) return res.json({ message: "Already liked" });

  await db.insert(likesTable).values({ id: generateId(), userId: user.id, trackId });
  await db.update(tracksTable).set({ likeCount: sql`${tracksTable.likeCount} + 1` }).where(eq(tracksTable.id, trackId));

  res.json({ message: "Liked" });
});

router.delete("/likes/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.params;

  await db.delete(likesTable).where(and(eq(likesTable.userId, user.id), eq(likesTable.trackId, trackId)));
  await db.update(tracksTable).set({ likeCount: sql`GREATEST(${tracksTable.likeCount} - 1, 0)` }).where(eq(tracksTable.id, trackId));

  res.json({ message: "Unliked" });
});

// Save track
router.post("/saves/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.params;

  const existing = await db.select().from(savesTable).where(and(eq(savesTable.userId, user.id), eq(savesTable.trackId, trackId))).limit(1);
  if (existing[0]) return res.json({ message: "Already saved" });

  await db.insert(savesTable).values({ id: generateId(), userId: user.id, trackId });
  await db.update(tracksTable).set({ saveCount: sql`${tracksTable.saveCount} + 1` }).where(eq(tracksTable.id, trackId));

  res.json({ message: "Saved" });
});

router.delete("/saves/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.params;

  await db.delete(savesTable).where(and(eq(savesTable.userId, user.id), eq(savesTable.trackId, trackId)));
  await db.update(tracksTable).set({ saveCount: sql`GREATEST(${tracksTable.saveCount} - 1, 0)` }).where(eq(tracksTable.id, trackId));

  res.json({ message: "Unsaved" });
});

// Follow state check
router.get("/follows/:creatorId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { creatorId } = req.params;
  const existing = await db.select().from(followsTable)
    .where(and(eq(followsTable.followerUserId, user.id), eq(followsTable.creatorId, creatorId)))
    .limit(1);
  res.json({ isFollowing: !!existing[0] });
});

// Follow creator
router.post("/follows/:creatorId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { creatorId } = req.params;

  const existing = await db.select().from(followsTable).where(and(eq(followsTable.followerUserId, user.id), eq(followsTable.creatorId, creatorId))).limit(1);
  if (existing[0]) return res.json({ message: "Already following" });

  await db.insert(followsTable).values({ id: generateId(), followerUserId: user.id, creatorId });

  res.json({ message: "Following" });
});

router.delete("/follows/:creatorId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { creatorId } = req.params;

  await db.delete(followsTable).where(and(eq(followsTable.followerUserId, user.id), eq(followsTable.creatorId, creatorId)));

  res.json({ message: "Unfollowed" });
});

// Library
router.get("/library", requireAuth, async (req, res) => {
  const user = (req as any).user;

  const savedRows = await db.select({ track: tracksTable, creator: creatorProfilesTable })
    .from(savesTable)
    .leftJoin(tracksTable, eq(savesTable.trackId, tracksTable.id))
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(eq(savesTable.userId, user.id));

  const likedRows = await db.select({ track: tracksTable, creator: creatorProfilesTable })
    .from(likesTable)
    .leftJoin(tracksTable, eq(likesTable.trackId, tracksTable.id))
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(eq(likesTable.userId, user.id));

  const followedRows = await db.select({ creator: creatorProfilesTable })
    .from(followsTable)
    .leftJoin(creatorProfilesTable, eq(followsTable.creatorId, creatorProfilesTable.id))
    .where(eq(followsTable.followerUserId, user.id));

  res.json({
    savedTracks: savedRows.filter(r => r.track).map(r => formatTrack(r.track!, r.creator)),
    likedTracks: likedRows.filter(r => r.track).map(r => formatTrack(r.track!, r.creator)),
    followedCreators: followedRows.filter(r => r.creator).map(r => formatCreator(r.creator!)),
  });
});

// Track interaction state
router.get("/interactions/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.params;

  const liked = await db.select().from(likesTable).where(and(eq(likesTable.userId, user.id), eq(likesTable.trackId, trackId))).limit(1);
  const saved = await db.select().from(savesTable).where(and(eq(savesTable.userId, user.id), eq(savesTable.trackId, trackId))).limit(1);

  res.json({ isLiked: !!liked[0], isSaved: !!saved[0] });
});

function formatTrack(t: any, creator: any) {
  return {
    id: t.id, creatorId: t.creatorId, title: t.title, slug: t.slug,
    description: t.description, audioUrl: t.audioUrl, coverImageUrl: t.coverImageUrl,
    genre: t.genre, moodTags: t.moodTags, soulStory: t.soulStory,
    aiInvolvementType: t.aiInvolvementType, visibility: t.visibility,
    moderationStatus: t.moderationStatus, isFeatured: t.isFeatured,
    playCount: t.playCount, likeCount: t.likeCount, saveCount: t.saveCount,
    createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
    updatedAt: t.updatedAt?.toISOString?.() ?? t.updatedAt,
    creator: creator ? formatCreator(creator) : null,
  };
}

function formatCreator(c: any) {
  return {
    id: c.id, artistName: c.artistName, slug: c.slug, bio: c.bio,
    avatarUrl: c.avatarUrl, bannerUrl: c.bannerUrl, genres: c.genres,
    moodIdentityTags: c.moodIdentityTags, aiToolsUsed: c.aiToolsUsed,
    socialLinks: c.socialLinks, creatorStatement: c.creatorStatement,
    createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
  };
}

export default router;
