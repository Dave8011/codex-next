// pages/api/files/create-folder.js
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.MY_CODEX_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { path } = req.body;
  const [owner, repo] = ['Dave8011', 'codex-next'];

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `${path}/.gitkeep`,
      message: `Create folder ${path}`,
      content: '',
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create folder', details: err.message });
  }
}
