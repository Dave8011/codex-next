// pages/api/files/create-folder.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.MY_CODEX_TOKEN });

const owner = "Dave8011";
const repo = "codex-next";
const basePath = "Codex/Codes";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { folderPath } = req.body;
  const gitkeepPath = `${basePath}/${folderPath}/.gitkeep`;

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: gitkeepPath,
      message: `📁 Create folder ${folderPath}`,
      content: "",
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to create folder", details: err.message });
  }
}
