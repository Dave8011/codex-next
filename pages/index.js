import { useState } from 'react';

export default function Home() {
  const [filePath, setFilePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    const res = await fetch('/api/push-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content: fileContent })
    });

    const data = await res.json();
    setMessage(data.message || data.error);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📁 Codex Editor (Next.js)</h1>

      <input
        type="text"
        value={filePath}
        placeholder="e.g. Codes/test.html"
        onChange={(e) => setFilePath(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <textarea
        value={fileContent}
        onChange={(e) => setFileContent(e.target.value)}
        rows={10}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <button onClick={handleSave}>💾 Save to GitHub</button>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}
