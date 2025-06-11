// pages/api/files/list.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.MY_CODEX_TOKEN });

const owner = "Dave8011";
const repo = "codex-next";
const basePath = "Codex/Codes";

export default async function handler(req, res) {
  const { subpath = "" } = req.query;
  const fullPath = `${basePath}${subpath ? "/" + subpath : ""}`;

  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: fullPath,
    });

    const files = response.data.map((item) => ({
      name: item.name,
      type: item.type,
    }));

    res.status(200).json({ files });
  } catch (error) {
    res.status(500).json({ error: "Failed to read directory", details: error.message });
  }
}
