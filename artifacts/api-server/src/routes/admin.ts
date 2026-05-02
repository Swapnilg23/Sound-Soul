import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, creatorProfilesTable, tracksTable, reportsTable,
  fanEmailsTable, proWaitlistTable, likesTable, savesTable,
} from "@workspace/db";
import { eq, count, sum, and } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/metrics", requireAdmin, async (req, res) => {
  const [creatorsCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "creator"));
  const [listenersCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "listener"));
  const [totalTracksResult] = await db.select({ count: count() }).from(tracksTable);
  const [pendingResult] = await db.select({ count: count() }).from(tracksTable).where(and(eq(tracksTable.visibility, "public"), eq(tracksTable.moderationStatus, "pending")));
  const [approvedResult] = await db.select({ count: count() }).from(tracksTable).where(eq(tracksTable.moderationStatus, "approved"));
  const [fanEmailsResult] = await db.select({ count: count() }).from(fanEmailsTable);
  const [waitlistResult] = await db.select({ count: count() }).from(proWaitlistTable);
  const [openReportsResult] = await db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.status, "open"));

  const tracks = await db.select().from(tracksTable);
  const totalPlays = tracks.reduce((s, t) => s + t.playCount, 0);
  const totalLikes = tracks.reduce((s, t) => s + t.likeCount, 0);
  const totalSaves = tracks.reduce((s, t) => s + t.saveCount, 0);

  res.json({
    totalCreators: Number(creatorsCount?.count ?? 0),
    totalListeners: Number(listenersCount?.count ?? 0),
    totalTracks: Number(totalTracksResult?.count ?? 0),
    pendingTracks: Number(pendingResult?.count ?? 0),
    approvedTracks: Number(approvedResult?.count ?? 0),
    totalPlays,
    totalLikes,
    totalSaves,
    totalFanEmails: Number(fanEmailsResult?.count ?? 0),
    proWaitlistCount: Number(waitlistResult?.count ?? 0),
    openReports: Number(openReportsResult?.count ?? 0),
  });
});

router.get("/tracks", requireAdmin, async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  const conditions = status ? [eq(tracksTable.moderationStatus, status as any)] : [];

  const rows = await db.select({ track: tracksTable, creator: creatorProfilesTable })
    .from(tracksTable)
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(tracksTable.createdAt)
    .limit(Number(limit))
    .offset(Number(offset));

  res.json(rows.map(r => ({
    id: r.track.id,
    title: r.track.title,
    slug: r.track.slug,
    coverImageUrl: r.track.coverImageUrl,
    genre: r.track.genre,
    aiInvolvementType: r.track.aiInvolvementType,
    visibility: r.track.visibility,
    moderationStatus: r.track.moderationStatus,
    isFeatured: r.track.isFeatured,
    playCount: r.track.playCount,
    likeCount: r.track.likeCount,
    reportCount: r.track.reportCount,
    createdAt: r.track.createdAt.toISOString(),
    creator: r.creator ? {
      id: r.creator.id, artistName: r.creator.artistName, slug: r.creator.slug,
      bio: r.creator.bio, avatarUrl: r.creator.avatarUrl, bannerUrl: r.creator.bannerUrl,
      genres: r.creator.genres, moodIdentityTags: r.creator.moodIdentityTags,
      aiToolsUsed: r.creator.aiToolsUsed, createdAt: r.creator.createdAt.toISOString(),
    } : null,
  })));
});

router.post("/tracks/:trackId/approve", requireAdmin, async (req, res) => {
  const { trackId } = req.params;
  await db.update(tracksTable).set({ moderationStatus: "approved" }).where(eq(tracksTable.id, trackId));
  res.json({ message: "Track approved" });
});

router.post("/tracks/:trackId/reject", requireAdmin, async (req, res) => {
  const { trackId } = req.params;
  await db.update(tracksTable).set({ moderationStatus: "rejected" }).where(eq(tracksTable.id, trackId));
  res.json({ message: "Track rejected" });
});

router.post("/tracks/:trackId/feature", requireAdmin, async (req, res) => {
  const { trackId } = req.params;
  const { featured } = req.body;
  await db.update(tracksTable).set({ isFeatured: Boolean(featured) }).where(eq(tracksTable.id, trackId));
  res.json({ message: featured ? "Track featured" : "Track unfeatured" });
});

router.delete("/tracks/:trackId", requireAdmin, async (req, res) => {
  const { trackId } = req.params;
  await db.delete(tracksTable).where(eq(tracksTable.id, trackId));
  res.json({ message: "Track deleted" });
});

router.get("/reports", requireAdmin, async (req, res) => {
  const { status } = req.query;
  const conditions = status ? [eq(reportsTable.status, status as any)] : [];

  const rows = await db.select({ report: reportsTable, track: tracksTable })
    .from(reportsTable)
    .leftJoin(tracksTable, eq(reportsTable.trackId, tracksTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(reportsTable.createdAt);

  res.json(rows.map(r => ({
    id: r.report.id,
    trackId: r.report.trackId,
    trackTitle: r.track?.title,
    trackSlug: r.track?.slug,
    reporterEmail: r.report.reporterEmail,
    reason: r.report.reason,
    details: r.report.details,
    status: r.report.status,
    createdAt: r.report.createdAt.toISOString(),
  })));
});

router.post("/reports/:reportId/resolve", requireAdmin, async (req, res) => {
  const { reportId } = req.params;
  const { status } = req.body;
  await db.update(reportsTable).set({ status }).where(eq(reportsTable.id, reportId));
  res.json({ message: "Report updated" });
});

router.get("/users", requireAdmin, async (req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const profiles = await db.select().from(creatorProfilesTable);
  const tracks = await db.select().from(tracksTable);

  const profileMap = new Map(profiles.map(p => [p.userId, p]));
  const trackCountMap = new Map<string, number>();
  for (const t of tracks) {
    const prof = profiles.find(p => p.id === t.creatorId);
    if (prof) {
      trackCountMap.set(prof.userId, (trackCountMap.get(prof.userId) ?? 0) + 1);
    }
  }

  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    artistName: profileMap.get(u.id)?.artistName,
    trackCount: trackCountMap.get(u.id) ?? 0,
  })));
});

export default router;
