// pages/api/files/save.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.MY_CODEX_TOKEN });

const owner = "Dave8011";
const repo = "codex-next";
const basePath = "Codex/Codes";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { path, content } = req.body;
  const filePath = `${basePath}${path}`;

  try {
    // Get current SHA
    const { data: existing } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });

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
    res.status(500).json({ error: "Failed to save file", details: err.message });
  }
}
