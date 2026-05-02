import { Router } from "express";
import { db } from "@workspace/db";
import {
  likesTable, savesTable, followsTable, tracksTable, creatorProfilesTable, repostsTable,
} from "@workspace/db";
import { eq, and, sql, inArray, desc, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { generateId } from "../lib/id";
import { notify } from "../lib/notify";

async function getTrackCreator(trackId: string) {
  const [row] = await db
    .select({
      trackSlug: tracksTable.slug,
      trackTitle: tracksTable.title,
      creatorUserId: creatorProfilesTable.userId,
      creatorSlug: creatorProfilesTable.slug,
      creatorName: creatorProfilesTable.artistName,
    })
    .from(tracksTable)
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(eq(tracksTable.id, trackId))
    .limit(1);
  return row ?? null;
}

const router = Router();

// Like track
router.post("/likes/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.params;

  const existing = await db.select().from(likesTable).where(and(eq(likesTable.userId, user.id), eq(likesTable.trackId, trackId))).limit(1);
  if (existing[0]) return res.json({ message: "Already liked" });

  await db.insert(likesTable).values({ id: generateId(), userId: user.id, trackId });
  await db.update(tracksTable).set({ likeCount: sql`${tracksTable.likeCount} + 1` }).where(eq(tracksTable.id, trackId));

  // Notify track creator (fire-and-forget)
  getTrackCreator(trackId).then(tc => {
    if (tc?.creatorUserId && tc.creatorUserId !== user.id) {
      const actorName = user.email.split('@')[0];
      notify({
        userId: tc.creatorUserId,
        type: 'like',
        title: `${actorName} liked your track`,
        body: tc.trackTitle,
        trackSlug: tc.trackSlug ?? undefined,
      });
    }
  });

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

  // Notify the creator (fire-and-forget)
  db.select({ userId: creatorProfilesTable.userId, slug: creatorProfilesTable.slug, artistName: creatorProfilesTable.artistName })
    .from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.id, creatorId))
    .limit(1)
    .then(([creator]) => {
      if (creator && creator.userId !== user.id) {
        const actorName = user.email.split('@')[0];
        notify({
          userId: creator.userId,
          type: 'follow',
          title: `${actorName} started following you`,
          body: `You have a new follower on Sound2Soul`,
          creatorSlug: creator.slug ?? undefined,
        });
      }
    });

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

// Following feed — recent tracks from creators the user follows
router.get("/following/feed", requireAuth, async (req, res) => {
  const user = (req as any).user;

  const follows = await db.select({ creatorId: followsTable.creatorId })
    .from(followsTable)
    .where(eq(followsTable.followerUserId, user.id));

  if (follows.length === 0) {
    return res.json({ tracks: [] });
  }

  const creatorIds = follows.map(f => f.creatorId);

  const rows = await db.select({ track: tracksTable, creator: creatorProfilesTable })
    .from(tracksTable)
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(and(
      inArray(tracksTable.creatorId, creatorIds),
      eq(tracksTable.moderationStatus, "approved"),
      eq(tracksTable.visibility, "public"),
    ))
    .orderBy(desc(tracksTable.createdAt))
    .limit(20);

  res.json({ tracks: rows.filter(r => r.track).map(r => formatTrack(r.track!, r.creator)) });
});

// Track interaction state
router.get("/interactions/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.params;

  const liked = await db.select().from(likesTable).where(and(eq(likesTable.userId, user.id), eq(likesTable.trackId, trackId))).limit(1);
  const saved = await db.select().from(savesTable).where(and(eq(savesTable.userId, user.id), eq(savesTable.trackId, trackId))).limit(1);

  res.json({ isLiked: !!liked[0], isSaved: !!saved[0] });
});

// ── Reposts ─────────────────────────────────────────────────────────────────

// GET /reposts/feed — tracks reposted by followed creators (must be before /:trackId)
router.get("/reposts/feed", requireAuth, async (req, res) => {
  const user = (req as any).user;

  const follows = await db.select({ creatorId: followsTable.creatorId })
    .from(followsTable)
    .where(eq(followsTable.followerUserId, user.id));

  const creatorIds = follows.map(f => f.creatorId);

  const followedCreatorUsers = creatorIds.length > 0
    ? await db.select({ userId: creatorProfilesTable.userId })
        .from(creatorProfilesTable)
        .where(inArray(creatorProfilesTable.id, creatorIds))
    : [];

  const followedUserIds = followedCreatorUsers.map(r => r.userId);

  if (followedUserIds.length === 0) return res.json({ tracks: [] });

  const repostRows = await db
    .select({ repost: repostsTable, track: tracksTable, creator: creatorProfilesTable })
    .from(repostsTable)
    .leftJoin(tracksTable, eq(repostsTable.trackId, tracksTable.id))
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(
      and(
        inArray(repostsTable.userId, followedUserIds),
        eq(tracksTable.moderationStatus, "approved"),
        eq(tracksTable.visibility, "public"),
      )
    )
    .orderBy(desc(repostsTable.createdAt))
    .limit(20);

  res.json({
    tracks: repostRows
      .filter(r => r.track)
      .map(r => ({ ...formatTrack(r.track!, r.creator), repostedAt: r.repost.createdAt?.toISOString?.() ?? r.repost.createdAt })),
  });
});

// GET /library/reposts — current user's own reposts (must be before /:trackId)
router.get("/library/reposts", requireAuth, async (req, res) => {
  const user = (req as any).user;

  const rows = await db
    .select({ track: tracksTable, creator: creatorProfilesTable })
    .from(repostsTable)
    .leftJoin(tracksTable, eq(repostsTable.trackId, tracksTable.id))
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(eq(repostsTable.userId, user.id))
    .orderBy(desc(repostsTable.createdAt));

  res.json({ tracks: rows.filter(r => r.track).map(r => formatTrack(r.track!, r.creator)) });
});

// GET repost state + count for a track
router.get("/reposts/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.params;

  const [existing, [{ total }]] = await Promise.all([
    db.select().from(repostsTable)
      .where(and(eq(repostsTable.userId, user.id), eq(repostsTable.trackId, trackId)))
      .limit(1),
    db.select({ total: count() }).from(repostsTable).where(eq(repostsTable.trackId, trackId)),
  ]);

  res.json({ isReposted: !!existing[0], count: Number(total) });
});

// POST repost
router.post("/reposts/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.params;

  const existing = await db.select().from(repostsTable)
    .where(and(eq(repostsTable.userId, user.id), eq(repostsTable.trackId, trackId)))
    .limit(1);

  if (existing[0]) return res.json({ message: "Already reposted" });

  await db.insert(repostsTable).values({
    id: generateId(),
    userId: user.id,
    trackId,
    note: req.body.note || null,
  });

  // Notify track creator (fire-and-forget)
  getTrackCreator(trackId).then(tc => {
    if (tc?.creatorUserId && tc.creatorUserId !== user.id) {
      const actorName = user.email.split('@')[0];
      notify({
        userId: tc.creatorUserId,
        type: 'repost',
        title: `${actorName} reposted your track`,
        body: tc.trackTitle,
        trackSlug: tc.trackSlug ?? undefined,
      });
    }
  });

  res.json({ message: "Reposted" });
});

// DELETE repost
router.delete("/reposts/:trackId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { trackId } = req.params;

  await db.delete(repostsTable)
    .where(and(eq(repostsTable.userId, user.id), eq(repostsTable.trackId, trackId)));

  res.json({ message: "Repost removed" });
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
