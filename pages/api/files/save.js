// pages/api/files/save.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.MY_CODEX_TOKEN });

const owner = "Dave8011";
const repo = "codex-next";
const basePath = "Codex/Codes";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).end("Method Not Allowed");

  const { path, content } = req.body;

  if (!path || !content)
    return res.status(400).json({ error: "Missing path or content" });

  // Ensure filePath is safe and correctly formatted
  const cleanPath = path.replace(/^\/+/, ""); // remove leading slashes
  const filePath = `${basePath}/${cleanPath}`;

  try {
    // Get current SHA of the existing file
    const { data: existing } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });

    // Update file content using GitHub API
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `💾 Update ${filePath}`,
      content: Buffer.from(content).toString("base64"),
      sha: existing.sha,
    });

    res.status(200).json({ success: true, response });
  } catch (err) {
    console.error("❌ Save API error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to save file",
      details: err.message,
    });
  }
}
