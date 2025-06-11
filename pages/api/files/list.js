import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const rootDir = path.join(process.cwd(), 'Codex/codes');
  const { subpath = '' } = req.query;
  const targetPath = path.join(rootDir, subpath);

  try {
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });

    const files = entries.map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? 'folder' : 'file',
    }));

    res.status(200).json({ files });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read directory', details: err.message });
  }
}
