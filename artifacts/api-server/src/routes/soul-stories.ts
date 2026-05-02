import { Router } from "express";
import { db } from "@workspace/db";
import {
  soulStoriesTable, tracksTable, creatorProfilesTable, usersTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth";
import { generateId } from "../lib/id";
import { notify } from "../lib/notify";

const router = Router({ mergeParams: true });

async function getTrackBySlug(slug: string) {
  const [track] = await db.select().from(tracksTable).where(eq(tracksTable.slug, slug)).limit(1);
  return track;
}

// GET /api/tracks/:slug/soul-stories
router.get("/", optionalAuth, async (req, res) => {
  const { slug } = req.params;
  const track = await getTrackBySlug(slug);
  if (!track) return res.status(404).json({ error: "Track not found" });

  const stories = await db
    .select()
    .from(soulStoriesTable)
    .where(eq(soulStoriesTable.trackId, track.id))
    .orderBy(desc(soulStoriesTable.isPinned), desc(soulStoriesTable.createdAt));

  const userIds = [...new Set(stories.map(s => s.userId))];
  const authors: any[] = [];
  for (const uid of userIds) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    if (u) {
      const [cp] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, uid)).limit(1);
      authors.push({ id: u.id, displayName: cp?.artistName ?? u.email.split("@")[0], avatarUrl: cp?.avatarUrl ?? null, slug: cp?.slug ?? null });
    }
  }
  const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));

  const currentUserId = (req as any).user?.id;

  res.json({
    stories: stories.map(s => ({
      id: s.id,
      body: s.body,
      isPinned: s.isPinned,
      createdAt: s.createdAt,
      isOwn: s.userId === currentUserId,
      author: authorMap[s.userId] ?? { displayName: "Listener", avatarUrl: null, slug: null },
    })),
  });
});

// POST /api/tracks/:slug/soul-stories — submit
router.post("/", requireAuth, async (req, res) => {
  const { slug } = req.params;
  const user = (req as any).user;
  const { body } = req.body;

  if (!body?.trim()) return res.status(400).json({ error: "Story body required" });
  if (body.trim().length > 200) return res.status(400).json({ error: "Max 200 characters" });

  const track = await getTrackBySlug(slug);
  if (!track) return res.status(404).json({ error: "Track not found" });

  const existing = await db.select().from(soulStoriesTable)
    .where(and(eq(soulStoriesTable.trackId, track.id), eq(soulStoriesTable.userId, user.id))).limit(1);

  if (existing.length > 0) {
    await db.update(soulStoriesTable)
      .set({ body: body.trim() })
      .where(eq(soulStoriesTable.id, existing[0].id));
    return res.json({ message: "Updated" });
  }

  await db.insert(soulStoriesTable).values({
    id: generateId(), trackId: track.id, userId: user.id, body: body.trim(),
    isPinned: false, createdAt: new Date(),
  });

  // Notify track creator (fire-and-forget)
  db.select({ userId: creatorProfilesTable.userId, slug: creatorProfilesTable.slug })
    .from(tracksTable)
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(eq(tracksTable.id, track.id))
    .limit(1)
    .then(([row]) => {
      if (row?.userId && row.userId !== user.id) {
        const actorName = user.email.split('@')[0];
        notify({
          userId: row.userId,
          type: 'soul_story',
          title: `${actorName} shared a Soul Story`,
          body: `on "${track.title}"`,
          trackSlug: slug,
        });
      }
    });

  res.status(201).json({ message: "Submitted" });
});

// PATCH /api/tracks/:slug/soul-stories/:id/pin — pin (creator only)
router.patch("/:storyId/pin", requireAuth, async (req, res) => {
  const { slug, storyId } = req.params;
  const user = (req as any).user;

  const track = await getTrackBySlug(slug);
  if (!track) return res.status(404).json({ error: "Track not found" });

  const [profile] = await db.select().from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.userId, user.id)).limit(1);
  if (!profile || profile.id !== track.creatorId) {
    return res.status(403).json({ error: "Only the creator can pin stories" });
  }

  await db.update(soulStoriesTable)
    .set({ isPinned: false })
    .where(eq(soulStoriesTable.trackId, track.id));

  await db.update(soulStoriesTable)
    .set({ isPinned: true })
    .where(and(eq(soulStoriesTable.id, storyId), eq(soulStoriesTable.trackId, track.id)));

  res.json({ message: "Pinned" });
});

// PATCH /api/tracks/:slug/soul-stories/:id/unpin — unpin (creator only)
router.patch("/:storyId/unpin", requireAuth, async (req, res) => {
  const { slug, storyId } = req.params;
  const user = (req as any).user;

  const track = await getTrackBySlug(slug);
  if (!track) return res.status(404).json({ error: "Track not found" });

  const [profile] = await db.select().from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.userId, user.id)).limit(1);
  if (!profile || profile.id !== track.creatorId) {
    return res.status(403).json({ error: "Only the creator can unpin stories" });
  }

  await db.update(soulStoriesTable)
    .set({ isPinned: false })
    .where(and(eq(soulStoriesTable.id, storyId), eq(soulStoriesTable.trackId, track.id)));

  res.json({ message: "Unpinned" });
});

// DELETE /api/tracks/:slug/soul-stories/:id
router.delete("/:storyId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { storyId } = req.params;

  const [story] = await db.select().from(soulStoriesTable).where(eq(soulStoriesTable.id, storyId)).limit(1);
  if (!story) return res.status(404).json({ error: "Story not found" });

  const canDelete = story.userId === user.id || user.role === "admin";
  if (!canDelete) return res.status(403).json({ error: "Forbidden" });

  await db.delete(soulStoriesTable).where(eq(soulStoriesTable.id, storyId));
  res.json({ message: "Deleted" });
});

export default router;
