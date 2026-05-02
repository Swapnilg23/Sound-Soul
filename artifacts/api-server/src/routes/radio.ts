import { Router } from "express";
import { db } from "@workspace/db";
import { tracksTable, creatorProfilesTable } from "@workspace/db";
import { eq, and, sql, inArray } from "drizzle-orm";

const router = Router();

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(track: any, profile: any) {
  return {
    id: track.id,
    title: track.title,
    slug: track.slug,
    genre: track.genre,
    moodTags: track.moodTags ?? [],
    audioUrl: track.audioUrl,
    coverImageUrl: track.coverImageUrl,
    playCount: track.playCount,
    likeCount: track.likeCount,
    creator: {
      artistName: profile.artistName,
      slug: profile.slug,
      avatarUrl: profile.avatarUrl,
    },
  };
}

// GET /api/radio?mood=chill&genre=Lo-Fi&limit=20
router.get("/", async (req, res) => {
  const { mood, genre, limit = "20" } = req.query as Record<string, string>;
  const maxResults = Math.min(parseInt(limit, 10) || 20, 40);

  const allTracks = await db
    .select()
    .from(tracksTable)
    .where(
      and(
        eq(tracksTable.visibility, "public"),
        eq(tracksTable.moderationStatus, "approved")
      )
    );

  const tag = (mood || genre || "").toLowerCase();

  const filtered = tag
    ? allTracks.filter(t => {
        const moodMatch = t.moodTags?.some(m => m.toLowerCase().includes(tag));
        const genreMatch = t.genre?.toLowerCase().includes(tag);
        return moodMatch || genreMatch;
      })
    : allTracks;

  const pool = filtered.length >= 5 ? filtered : allTracks;
  const selected = shuffle(pool).slice(0, maxResults);

  const creatorIds = [...new Set(selected.map(t => t.creatorId))];
  const profiles = creatorIds.length > 0
    ? await db.select().from(creatorProfilesTable).where(inArray(creatorProfilesTable.id, creatorIds))
    : [];

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

  res.json({
    tag: tag || "all",
    tracks: selected.map(t => fmt(t, profileMap[t.creatorId] ?? { artistName: "Unknown", slug: "", avatarUrl: null })),
  });
});

export default router;
