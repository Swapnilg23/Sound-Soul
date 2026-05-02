import { Router } from "express";
import path from "path";
import fs from "fs";
import { requireAuth } from "../lib/auth";
import { generateId } from "../lib/id";

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(path.join(UPLOAD_DIR, "audio"))) {
  fs.mkdirSync(path.join(UPLOAD_DIR, "audio"), { recursive: true });
}
if (!fs.existsSync(path.join(UPLOAD_DIR, "images"))) {
  fs.mkdirSync(path.join(UPLOAD_DIR, "images"), { recursive: true });
}

// Generate upload URL (in production this would return a signed S3 URL)
// For MVP, we return a URL to our own upload endpoint
router.post("/audio-url", requireAuth, async (req, res) => {
  const { filename, contentType } = req.body;
  if (!filename) return res.status(400).json({ error: "Filename required" });

  const ext = path.extname(filename);
  const fileId = generateId();
  const storedName = `${fileId}${ext}`;
  const uploadUrl = `/api/upload/audio/${storedName}`;
  const publicUrl = `/api/files/audio/${storedName}`;

  res.json({ uploadUrl, publicUrl });
});

router.post("/image-url", requireAuth, async (req, res) => {
  const { filename, contentType } = req.body;
  if (!filename) return res.status(400).json({ error: "Filename required" });

  const ext = path.extname(filename);
  const fileId = generateId();
  const storedName = `${fileId}${ext}`;
  const uploadUrl = `/api/upload/image/${storedName}`;
  const publicUrl = `/api/files/images/${storedName}`;

  res.json({ uploadUrl, publicUrl });
});

export default router;
