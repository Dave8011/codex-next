import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { subpath = '' } = req.query;
  const baseDir = path.join(process.cwd(), 'Codex', 'codes');
  const targetDir = path.join(baseDir, subpath);

  try {
    const items = fs.readdirSync(targetDir, { withFileTypes: true });
    const files = items.map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'folder' : 'file',
    }));
    res.status(200).json({ files });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read directory', details: err.message });
  }
}
