import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, creatorProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth";
import { generateId } from "../lib/id";

const router = Router();

router.post("/signup", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password, and role are required" });
  }

  if (!["creator", "listener"].includes(role)) {
    return res.status(400).json({ error: "Role must be creator or listener" });
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing[0]) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = generateId();

  const [user] = await db.insert(usersTable).values({
    id,
    email,
    passwordHash,
    role,
  }).returning();

  const token = signToken(user.id);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = (req as any).user;

  let creatorProfile = null;
  if (user.role === "creator") {
    const profile = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);
    if (profile[0]) {
      creatorProfile = {
        id: profile[0].id,
        userId: profile[0].userId,
        artistName: profile[0].artistName,
        slug: profile[0].slug,
        bio: profile[0].bio,
        avatarUrl: profile[0].avatarUrl,
        bannerUrl: profile[0].bannerUrl,
        genres: profile[0].genres,
        moodIdentityTags: profile[0].moodIdentityTags,
        aiToolsUsed: profile[0].aiToolsUsed,
        socialLinks: profile[0].socialLinks,
        creatorStatement: profile[0].creatorStatement,
        createdAt: profile[0].createdAt.toISOString(),
        updatedAt: profile[0].updatedAt.toISOString(),
      };
    }
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    creatorProfile,
  });
});

export default router;
