import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.MY_CODEX_TOKEN,
});

const owner = "Dave8011";
const repo = "codex-next";
const branch = "main";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { path, content } = req.body;
  if (!path || !content) {
    return res.status(400).json({ error: "Missing path or content" });
  }

  const filePath = `Codex/Codes${path.startsWith("/") ? path : `/${path}`}`;

  try {
    // 1. Get the current file SHA (needed to update the file)
    let sha = null;
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branch,
      });
      sha = fileData.sha;
    } catch (err) {
      if (err.status !== 404) throw err; // Ignore file not found (it's a new file)
    }

    // 2. Create or update the file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Update ${filePath}`,
      content: Buffer.from(content).toString("base64"),
      sha: sha || undefined,
      branch,
    });

    return res.status(200).json({ message: "✅ File saved successfully" });
  } catch (error) {
    console.error("GitHub Save Error:", error);
    return res.status(500).json({ error: "❌ Failed to save file", details: error.message });
  }
}
