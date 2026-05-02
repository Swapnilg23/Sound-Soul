import { Router } from "express";
import { db } from "@workspace/db";
import { fanEmailsTable, creatorProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireCreator } from "../lib/auth";
import { generateId } from "../lib/id";
import { notify } from "../lib/notify";

const router = Router();

router.post("/", async (req, res) => {
  const { creatorId, trackId, email, consent, source } = req.body;

  if (!creatorId || !email || !consent) {
    return res.status(400).json({ error: "Creator ID, email, and consent are required" });
  }

  await db.insert(fanEmailsTable).values({
    id: generateId(),
    creatorId,
    trackId: trackId || null,
    email,
    consent: Boolean(consent),
    source: source || "track_page",
  });

  // Notify the creator (fire-and-forget)
  db.select({ userId: creatorProfilesTable.userId })
    .from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.id, creatorId))
    .limit(1)
    .then(([cp]) => {
      if (cp?.userId) {
        const maskedEmail = email.replace(/(.{2}).*@/, '$1***@');
        notify({
          userId: cp.userId,
          type: 'fan_email',
          title: 'New fan joined your list',
          body: maskedEmail,
        });
      }
    });

  res.status(201).json({ message: "Successfully subscribed to fan list" });
});

router.get("/mine", requireCreator, async (req, res) => {
  const user = (req as any).user;

  const { creatorProfilesTable } = await import("@workspace/db");
  const drizzle = await import("drizzle-orm");
  const [profile] = await db.select().from(creatorProfilesTable).where(drizzle.eq(creatorProfilesTable.userId, user.id)).limit(1);

  if (!profile) return res.json({ emails: [], total: 0 });

  const emails = await db.select().from(fanEmailsTable)
    .where(eq(fanEmailsTable.creatorId, profile.id))
    .orderBy(fanEmailsTable.createdAt);

  res.json({
    emails: emails.map(e => ({
      id: e.id,
      email: e.email,
      source: e.source,
      createdAt: e.createdAt.toISOString(),
    })),
    total: emails.length,
  });
});

export default router;
