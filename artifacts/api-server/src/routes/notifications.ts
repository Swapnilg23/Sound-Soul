import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, desc, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(rows.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    trackSlug: n.trackSlug,
    creatorSlug: n.creatorSlug,
    read: n.read,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
  })));
});

router.get("/unread-count", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const [{ total }] = await db
    .select({ total: count() })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));

  res.json({ count: Number(total) });
});

router.post("/read-all", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));

  res.json({ message: "All notifications marked as read" });
});

router.post("/:id/read", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));

  res.json({ message: "Notification marked as read" });
});

export default router;
