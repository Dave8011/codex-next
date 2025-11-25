export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Only POST allowed" });

  const { path, content } = req.body;
  if (!path || typeof content !== 'string') {
    return res.status(400).json({ message: "Missing file path or content" });
  }

  const token = process.env.MY_GH_TOKEN;
  const owner = "Dave8011";
  const repo = "Codex";
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  let sha = undefined;

  try {
    const getRes = await fetch(apiUrl, {
      headers: { Authorization: `token ${token}` }
    });

    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    const saveRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Updated via Codex`,
        content: Buffer.from(content).toString('base64'),
        sha
      })
    });

    const result = await saveRes.json();
    if (!saveRes.ok) return res.status(saveRes.status).json({ error: result.message });

    return res.status(200).json({ message: `✅ Saved: ${path}` });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
