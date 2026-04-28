import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

router.get("/backup", (req, res) => {
  const dbPath = path.join(__dirname, "../classroom.sqlite");
  const backupPath = path.join(__dirname, "../backup.sqlite");

  fs.copyFile(dbPath, backupPath, (err) => {
    if (err) {
      console.error("[BACKUP ERROR]:", err);
      return res.status(500).json({ message: "Backup failed", error: err.message });
    }
    res.json({ message: "Backup created successfully" });
  });
});

export default router;
