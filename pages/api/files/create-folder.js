// pages/api/files/create.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.MY_CODEX_TOKEN });

const owner = "Dave8011";
const repo = "codex-next";
const basePath = "Codex/Codes";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, type, subpath = "", content = "" } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: "Missing name or type" });
  }

  const targetPath = `${basePath}/${subpath ? `${subpath}/` : ""}${name}`;

  try {
    if (type === "folder") {
      // Create an empty folder by committing a `.gitkeep` file inside it
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `${targetPath}/.gitkeep`,
        message: `📁 Create folder: ${targetPath}`,
        content: "", // empty .gitkeep
      });
    } else if (type === "file") {
      // Create a new file with optional initial content
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: targetPath,
        message: `📄 Create file: ${targetPath}`,
        content: Buffer.from(content).toString("base64"),
      });
    } else {
      return res.status(400).json({ error: "Invalid type. Use 'file' or 'folder'." });
    }

    res.status(200).json({ success: true, path: targetPath });
  } catch (err) {
    console.error("Create API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create", details: err.message });
  }
}
