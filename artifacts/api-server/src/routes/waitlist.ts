import { Router } from "express";
import { db } from "@workspace/db";
import { proWaitlistTable } from "@workspace/db";
import { generateId } from "../lib/id";

const router = Router();

router.post("/", async (req, res) => {
  const user = (req as any).user;
  const { email, desiredPlan } = req.body;

  if (!email || !desiredPlan) {
    return res.status(400).json({ error: "Email and desired plan are required" });
  }

  if (!["pro", "studio"].includes(desiredPlan)) {
    return res.status(400).json({ error: "Plan must be pro or studio" });
  }

  await db.insert(proWaitlistTable).values({
    id: generateId(),
    userId: user?.id || null,
    email,
    desiredPlan,
  });

  res.status(201).json({ message: `You're on the ${desiredPlan} waitlist! We'll be in touch soon.` });
});

export default router;
