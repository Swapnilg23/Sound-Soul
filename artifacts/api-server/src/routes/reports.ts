import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, tracksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { generateId } from "../lib/id";

const router = Router();

router.post("/", async (req, res) => {
  const { trackId, reason, details, reporterEmail } = req.body;

  if (!trackId || !reason) {
    return res.status(400).json({ error: "Track ID and reason are required" });
  }

  const [track] = await db.select().from(tracksTable).where(eq(tracksTable.id, trackId)).limit(1);
  if (!track) return res.status(404).json({ error: "Track not found" });

  await db.insert(reportsTable).values({
    id: generateId(),
    trackId,
    reason,
    details,
    reporterEmail,
    status: "open",
  });

  await db.update(tracksTable).set({ reportCount: sql`${tracksTable.reportCount} + 1` }).where(eq(tracksTable.id, trackId));

  res.status(201).json({ message: "Report submitted. Thank you for helping keep Sound2Soul safe." });
});

export default router;
