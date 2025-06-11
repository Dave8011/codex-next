// pages/api/files/save.js

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path: filePath, content } = req.body;

  if (!filePath || typeof content !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const fullPath = path.join(process.cwd(), 'Codex', 'Codes', filePath);
    fs.writeFileSync(fullPath, content, 'utf8');
    res.status(200).json({ message: 'File saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save file', details: err.message });
  }
}
