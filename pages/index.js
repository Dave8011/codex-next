// pages/index.js
import { useEffect, useState } from 'react';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async (subpath = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/list?subpath=${subpath}`);
      const data = await res.json();
      setFiles(data.files || []);
      setCurrentPath(subpath);
    } catch (err) {
      console.error('Failed to load files', err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (filename) => {
    try {
      const res = await fetch(`/api/files/open?path=${currentPath}/${filename}`);
      const data = await res.json();
      setFileContent({ name: filename, content: data.content });
    } catch (err) {
      console.error('Failed to open file', err);
    }
  };

  const goBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    fetchFiles(parts.join('/'));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r border-slate-700">
        <h2 className="text-xl font-semibold mb-4">📁 File Tree</h2>
        <ul className="space-y-2">
          {files.length > 0 ? (
            files.map((file) => (
              <li key={file.name}>
                {file.type === 'folder' ? (
                  <button
                    className="text-blue-300 hover:underline"
                    onClick={() => fetchFiles(`${currentPath}/${file.name}`)}
                  >
                    📂 {file.name}
                  </button>
                ) : (
                  <button
                    className="text-green-300 hover:underline"
                    onClick={() => openFile(file.name)}
                  >
                    📄 {file.name}
                  </button>
                )}
              </li>
            ))
          ) : (
            <li className="text-gray-400 text-sm">No files found or failed to load.</li>
          )}
        </ul>
        {currentPath && (
          <button
            onClick={goBack}
            className="mt-4 inline-block text-sm text-gray-400 hover:text-white"
          >
            ⬅️ Back
          </button>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">
          {fileContent ? `📝 Editing: ${fileContent.name}` : '📁 Select a file to view'}
        </h1>

        {fileContent && (
          <div className="bg-slate-800 p-4 rounded shadow-md">
            <textarea
              className="w-full h-80 p-2 bg-slate-700 border border-slate-600 rounded text-white"
              value={fileContent.content}
              onChange={(e) =>
                setFileContent({ ...fileContent, content: e.target.value })
              }
            />
            <button
              className="mt-4 px-4 py-2 border border-white rounded hover:bg-white hover:text-black"
              onClick={async () => {
                const res = await fetch('/api/files/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    path: `${currentPath}/${fileContent.name}`,
                    content: fileContent.content,
                  }),
                });

                if (res.ok) {
                  alert('✅ File saved successfully!');
                } else {
                  alert('❌ Failed to save the file.');
                }
              }}
            >
              💾 Save
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
