// pages/api/files/list.js
import { Octokit } from "@octokit/rest";

// Authenticate GitHub API using your token
const octokit = new Octokit({ auth: process.env.MY_CODEX_TOKEN });

// Define repo details
const OWNER = "Dave8011";
const REPO = "codex-next";
const BASE_PATH = "Codex/Codes";

export default async function handler(req, res) {
  const subpath = req.query.subpath || "";
  const path = subpath ? `${BASE_PATH}/${subpath}` : BASE_PATH;

  try {
    // Get file/folder contents from GitHub
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
    });

    // Format results
    const files = Array.isArray(data)
      ? data.map((item) => ({
          name: item.name,
          type: item.type === "dir" ? "folder" : "file",
        }))
      : [];

    // Send successful response
    res.status(200).json({ files });
  } catch (err) {
    console.error("GitHub API Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Cannot read directory",
      details: err.message,
    });
  }
}
