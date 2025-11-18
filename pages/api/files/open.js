import fs from "fs/promises";
import path from "path";

// Define the absolute path to the intended directory
const baseDir = path.join(process.cwd(), "Codex");

export default async function handler(req, res) {
  const { path: filePath } = req.query;

  if (!filePath) {
    return res.status(400).json({ error: "File path is required." });
  }

  try {
    // Create the full, resolved path
    const targetPath = path.resolve(path.join(baseDir, filePath));

    // SECURITY CHECK: Ensure the resolved path is still inside the base directory
    if (!targetPath.startsWith(baseDir)) {
      return res.status(400).json({ error: "Invalid path." });
    }

    const content = await fs.readFile(targetPath, "utf-8");
    res.status(200).json({ content });
  } catch (e) {
    res.status(500).json({ error: "Failed to open file." });
  }
}
