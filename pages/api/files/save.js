import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

    const { path: filePathRel, content } = req.body;
    const fullPath = path.join(process.cwd(), 'Codex/Codes', filePathRel);

    try {
        fs.writeFileSync(fullPath, content, 'utf8');
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save file', details: err.message });
    }
}
