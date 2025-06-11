import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { path: filePath, content } = req.body;

  if (!filePath || !content) {
    return res.status(400).json({ error: 'Missing file path or content' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = 'codex-next';
  const OWNER = 'Dave8011';
  const BRANCH = 'main';

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    const fullPath = `Codex/Codes${filePath}`;

    // Get existing file SHA
    const { data: existingFile } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: fullPath,
      ref: BRANCH,
    });

    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: fullPath,
      message: `Update ${filePath}`,
      content: Buffer.from(content).toString('base64'),
      sha: existingFile.sha,
      branch: BRANCH,
    });

    res.status(200).json({ message: 'File updated successfully!' });

  } catch (err) {
    console.error('Save failed:', err);
    res.status(500).json({
      error: 'Failed to update file',
      details: err.message || 'Unknown error',
    });
  }
}
