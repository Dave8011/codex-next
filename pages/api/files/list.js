// pages/api/files/list.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.MY_CODEX_TOKEN });

const OWNER = "Dave8011";
const REPO = "codex-next";
const BASE_PATH = "Codex/Codes";

export default async function handler(req, res) {
  const subpath = req.query.subpath || "";
  const path = subpath ? `${BASE_PATH}/${subpath}` : BASE_PATH;

  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
    });

    const files = data.map((item) => ({
      name: item.name,
      type: item.type, // "file" or "dir"
    }));

    res.status(200).json({ files });
  } catch (err) {
    console.error("List API Error:", err);
    res.status(500).json({ error: "Cannot read directory", details: err.message });
  }
}
