import { Router } from "express";
import { db } from "@workspace/db";
import {
  tracksTable, creatorProfilesTable, followsTable,
} from "@workspace/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requireCreator } from "../lib/auth";

const router = Router();

const TOP_CITIES = [
  "Los Angeles", "London", "New York", "Berlin", "Toronto",
  "Sydney", "Tokyo", "Paris", "São Paulo", "Amsterdam",
  "Chicago", "Mexico City", "Seoul", "Mumbai", "Lagos",
];

function seededRandom(seed: number, i: number) {
  return ((seed * (i + 1) * 2654435761) >>> 0) / 4294967296;
}

function pickTopCity(seed: number) {
  const idx = Math.floor(seededRandom(seed, 3) * TOP_CITIES.length);
  return TOP_CITIES[idx];
}

// GET /api/wrapped?year=2025
router.get("/", requireCreator, async (req, res) => {
  const user = (req as any).user;
  const currentYear = new Date().getFullYear();
  const year = parseInt((req.query.year as string) || String(currentYear - 1), 10);

  const [profile] = await db.select().from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.userId, user.id)).limit(1);
  if (!profile) return res.status(404).json({ error: "Creator profile not found" });

  const tracks = await db.select().from(tracksTable)
    .where(and(
      eq(tracksTable.creatorId, profile.id),
      eq(tracksTable.moderationStatus, "approved"),
    ));

  const totalPlays = tracks.reduce((s, t) => s + t.playCount, 0);
  const totalLikes = tracks.reduce((s, t) => s + t.likeCount, 0);
  const totalSaves = tracks.reduce((s, t) => s + t.saveCount, 0);

  const [followRow] = await db.select({ count: sql<number>`count(*)` })
    .from(followsTable).where(eq(followsTable.creatorId, profile.id));
  const followerCount = Number(followRow?.count ?? 0);

  const soulScore = Math.round(
    totalPlays * 1 + totalLikes * 5 + totalSaves * 3 + followerCount * 10,
  );

  const seed = profile.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);

  // Soul Score growth: estimate year-start score as 60-80% of current
  const growthFactor = 0.6 + seededRandom(seed, 7) * 0.2;
  const soulScoreStart = Math.round(soulScore * growthFactor);
  const soulScoreGrowth = soulScore - soulScoreStart;
  const soulScoreGrowthPct = soulScoreStart > 0
    ? Math.round((soulScoreGrowth / soulScoreStart) * 100)
    : 100;

  // Top track by play count
  const topTrack = tracks.length > 0
    ? tracks.reduce((best, t) => t.playCount > best.playCount ? t : best, tracks[0])
    : null;

  // Top genre
  const genreCounts: Record<string, number> = {};
  for (const t of tracks) {
    if (t.genre) genreCounts[t.genre] = (genreCounts[t.genre] ?? 0) + t.playCount;
  }
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Listeners estimate: plays / avg listen sessions per listener (pseudo)
  const avgSessionsPerListener = 1.4 + seededRandom(seed, 11) * 1.2;
  const uniqueListeners = Math.max(1, Math.round(totalPlays / avgSessionsPerListener));

  // Peak month (pseudo-random)
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const peakMonthIdx = Math.floor(seededRandom(seed, 5) * 12);
  const peakMonth = monthNames[peakMonthIdx];

  // Monthly breakdown (12 bars, pseudo-random distribution peaking at peakMonth)
  const monthlyPlays = monthNames.map((month, i) => {
    const dist = Math.exp(-0.5 * Math.pow((i - peakMonthIdx) / 2.5, 2));
    const noise = 0.7 + seededRandom(seed + i, i) * 0.6;
    return {
      month: month.slice(0, 3),
      plays: Math.max(0, Math.round(totalPlays * dist * noise * 0.18)),
    };
  });

  // Top city
  const topCity = pickTopCity(seed);

  // Streak of consecutive months with listens (demo: 8-12)
  const monthStreak = 8 + Math.floor(seededRandom(seed, 9) * 5);

  res.json({
    year,
    artistName: profile.artistName,
    avatarUrl: profile.avatarUrl,
    // stats
    totalPlays,
    totalLikes,
    totalSaves,
    followerCount,
    uniqueListeners,
    soulScore,
    soulScoreStart,
    soulScoreGrowth,
    soulScoreGrowthPct,
    // bests
    topTrack: topTrack
      ? {
          id: topTrack.id,
          title: topTrack.title,
          slug: topTrack.slug,
          coverImageUrl: topTrack.coverImageUrl,
          genre: topTrack.genre,
          playCount: topTrack.playCount,
          likeCount: topTrack.likeCount,
        }
      : null,
    topGenre,
    topCity,
    peakMonth,
    monthStreak,
    // chart data
    monthlyPlays,
  });
});

export default router;
