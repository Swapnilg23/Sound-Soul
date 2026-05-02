import { Router } from "express";
import { db } from "@workspace/db";
import { commentsTable, tracksTable, usersTable, creatorProfilesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { generateId } from "../lib/id";
import { notify } from "../lib/notify";

const router = Router({ mergeParams: true });

// GET /api/tracks/:slug/comments
router.get("/", async (req, res) => {
  const { slug } = req.params;

  const track = await db.select({ id: tracksTable.id })
    .from(tracksTable)
    .where(eq(tracksTable.slug, slug))
    .limit(1);

  if (!track[0]) return res.status(404).json({ error: "Track not found" });

  const rows = await db
    .select({
      comment: commentsTable,
      user: { id: usersTable.id, email: usersTable.email, role: usersTable.role },
      creator: { artistName: creatorProfilesTable.artistName, avatarUrl: creatorProfilesTable.avatarUrl, slug: creatorProfilesTable.slug },
    })
    .from(commentsTable)
    .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
    .leftJoin(creatorProfilesTable, eq(commentsTable.userId, creatorProfilesTable.userId))
    .where(eq(commentsTable.trackId, track[0].id))
    .orderBy(desc(commentsTable.createdAt))
    .limit(100);

  res.json({
    comments: rows.map(r => ({
      id: r.comment.id,
      body: r.comment.body,
      createdAt: r.comment.createdAt?.toISOString?.() ?? r.comment.createdAt,
      author: {
        id: r.user?.id,
        displayName: r.creator?.artistName || r.user?.email?.split("@")[0] || "Listener",
        avatarUrl: r.creator?.avatarUrl || null,
        slug: r.creator?.slug || null,
        role: r.user?.role,
      },
    })),
  });
});

// POST /api/tracks/:slug/comments
router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { slug } = req.params;
  const { body } = req.body;

  if (!body || typeof body !== "string" || body.trim().length === 0) {
    return res.status(400).json({ error: "Comment body is required" });
  }
  if (body.trim().length > 500) {
    return res.status(400).json({ error: "Comment must be 500 characters or fewer" });
  }

  const track = await db.select({ id: tracksTable.id })
    .from(tracksTable)
    .where(eq(tracksTable.slug, slug))
    .limit(1);

  if (!track[0]) return res.status(404).json({ error: "Track not found" });

  const id = generateId();
  await db.insert(commentsTable).values({
    id,
    trackId: track[0].id,
    userId: user.id,
    body: body.trim(),
  });

  // Notify track creator (fire-and-forget)
  db.select({
    creatorUserId: creatorProfilesTable.userId,
    creatorSlug: creatorProfilesTable.slug,
  })
    .from(tracksTable)
    .leftJoin(creatorProfilesTable, eq(tracksTable.creatorId, creatorProfilesTable.id))
    .where(eq(tracksTable.id, track[0].id))
    .limit(1)
    .then(([row]) => {
      if (row?.creatorUserId && row.creatorUserId !== user.id) {
        const actorName = user.email.split('@')[0];
        notify({
          userId: row.creatorUserId,
          type: 'comment',
          title: `${actorName} commented on your track`,
          body: body.trim().slice(0, 80),
          trackSlug: slug,
        });
      }
    });

  res.json({ id, message: "Comment posted" });
});

// DELETE /api/tracks/:slug/comments/:commentId
router.delete("/:commentId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { commentId } = req.params;

  const comment = await db.select().from(commentsTable).where(eq(commentsTable.id, commentId)).limit(1);
  if (!comment[0]) return res.status(404).json({ error: "Comment not found" });
  if (comment[0].userId !== user.id && user.role !== "admin") {
    return res.status(403).json({ error: "Not authorized" });
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
  res.json({ message: "Deleted" });
});

export default router;
