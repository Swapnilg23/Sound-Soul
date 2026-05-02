import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "sound2soul-secret-key";

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
  if (!user[0]) {
    return res.status(401).json({ error: "User not found" });
  }

  (req as any).user = user[0];
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const user = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
      if (user[0]) {
        (req as any).user = user[0];
      }
    }
  }

  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    const user = (req as any).user;
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  });
}

export async function requireCreator(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    const user = (req as any).user;
    if (user?.role !== "creator") {
      return res.status(403).json({ error: "Only creators can perform this action" });
    }
    next();
  });
}
