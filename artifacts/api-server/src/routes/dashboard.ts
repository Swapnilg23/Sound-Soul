import { Router } from "express";
import { db } from "@workspace/db";
import {
  tracksTable, creatorProfilesTable, fanEmailsTable, likesTable, savesTable,
} from "@workspace/db";
import { eq, and, sum, count } from "drizzle-orm";
import { requireCreator } from "../lib/auth";

const router = Router();

router.get("/stats", requireCreator, async (req, res) => {
  const user = (req as any).user;
  const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);

  if (!profile) {
    return res.json({
      totalTracks: 0,
      publishedTracks: 0,
      pendingTracks: 0,
      draftTracks: 0,
      totalPlays: 0,
      totalLikes: 0,
      totalSaves: 0,
      fanEmailCount: 0,
      profileComplete: false,
      trustProfileComplete: false,
      trustItems: {
        profileCompleted: false,
        aiProcessDisclosed: false,
        humanContributionAdded: false,
        rightsConfirmationCompleted: false,
      },
    });
  }

  const tracks = await db.select().from(tracksTable).where(eq(tracksTable.creatorId, profile.id));

  const totalTracks = tracks.length;
  const publishedTracks = tracks.filter(t => t.visibility === "public" && t.moderationStatus === "approved").length;
  const pendingTracks = tracks.filter(t => t.visibility === "public" && t.moderationStatus === "pending").length;
  const draftTracks = tracks.filter(t => t.visibility === "draft").length;
  const totalPlays = tracks.reduce((sum, t) => sum + t.playCount, 0);
  const totalLikes = tracks.reduce((sum, t) => sum + t.likeCount, 0);
  const totalSaves = tracks.reduce((sum, t) => sum + t.saveCount, 0);

  const [fanCount] = await db.select({ count: count() }).from(fanEmailsTable).where(eq(fanEmailsTable.creatorId, profile.id));
  const fanEmailCount = Number(fanCount?.count ?? 0);

  const profileComplete = !!(profile.artistName && profile.bio && profile.avatarUrl);
  const aiProcessDisclosed = tracks.some(t => t.aiInvolvementType);
  const humanContributionAdded = tracks.some(t => {
    const hc = t.humanContributionChecklist as Record<string, boolean> | null;
    return hc && Object.values(hc).some(Boolean);
  });
  const rightsConfirmationCompleted = tracks.some(t => {
    const rc = t.rightsConfirmation as Record<string, boolean> | null;
    return rc && Object.values(rc).every(Boolean);
  });

  const trustItems = {
    profileCompleted: profileComplete,
    aiProcessDisclosed,
    humanContributionAdded,
    rightsConfirmationCompleted,
  };

  const trustProfileComplete = Object.values(trustItems).every(Boolean);

  res.json({
    totalTracks,
    publishedTracks,
    pendingTracks,
    draftTracks,
    totalPlays,
    totalLikes,
    totalSaves,
    fanEmailCount,
    profileComplete,
    trustProfileComplete,
    trustItems,
  });
});

export default router;
