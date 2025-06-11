import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const filePath = path.join(process.cwd(), 'Codex/codes', req.query.path || '');

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.status(200).json({ content });
    } catch (err) {
        res.status(500).json({ error: 'Cannot open file', details: err.message });
    }
}