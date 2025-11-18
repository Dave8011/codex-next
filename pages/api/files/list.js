import fs from "fs/promises";
import path from "path";

// Define the absolute path to the intended directory
const baseDir = path.join(process.cwd(), "Codex");

export default async function handler(req, res) {
  try {
    const subpath = req.query.subpath || "";
    // Create the full, resolved path
    const targetPath = path.resolve(path.join(baseDir, subpath));

    // SECURITY CHECK: Ensure the resolved path is still inside the base directory
    if (!targetPath.startsWith(baseDir)) {
      return res.status(400).json({ error: "Invalid path." });
    }

    const dirents = await fs.readdir(targetPath, { withFileTypes: true });
    const files = dirents.map((dirent) => ({
      name: dirent.name,
      type: dirent.isDirectory() ? "folder" : "file",
    }));
    res.status(200).json({ files });
  } catch (e) {
    res.status(500).json({ error: "Unable to list files." });
  }
}
