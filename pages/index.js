import { useEffect, useState } from 'react';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch list of files/folders for a given path
  const fetchFiles = async (subpath = '') => {
    const res = await fetch(`/api/files/list?subpath=${subpath}`);
    const data = await res.json();
    setFiles(data.files || []);
    setCurrentPath(subpath);
    setFileContent(null); // reset content when navigating
  };

  // Open and read file contents
  const openFile = async (filename) => {
    const fullPath = `${currentPath}/${filename}`;
    const res = await fetch(`/api/files/open?path=${fullPath}`);
    const data = await res.json();
    setFileContent({ name: filename, content: data.content });
  };

  // Initial fetch on page load
  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-800 text-white font-medium">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-slate-700 p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">📁 Codex Files</h1>
        <ul className="space-y-2">
          {files.length > 0 ? (
            files.map((file) => (
              <li key={file.name}>
                {file.type === 'folder' ? (
                  <button
                    className="w-full text-left text-blue-300 hover:underline"
                    onClick={() => fetchFiles(`${currentPath}/${file.name}`)}
                  >
                    📂 {file.name}
                  </button>
                ) : (
                  <button
                    className="w-full text-left text-green-300 hover:underline"
                    onClick={() => openFile(file.name)}
                  >
                    📄 {file.name}
                  </button>
                )}
              </li>
            ))
          ) : (
            <li className="text-slate-400">No files found or failed to load.</li>
          )}
        </ul>
      </aside>

      {/* Editor Panel */}
      <main className="flex-1 p-6">
        {fileContent ? (
          <div className="bg-slate-700 p-4 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-xl mb-2 font-semibold">
              ✍️ Editing: <span className="text-yellow-300">{fileContent.name}</span>
            </h2>
            <textarea
              className="w-full h-64 p-3 rounded bg-slate-900 text-white font-mono border border-slate-600"
              value={fileContent.content}
              onChange={(e) =>
                setFileContent({ ...fileContent, content: e.target.value })
              }
            />
            <div className="mt-4 flex justify-between items-center">
              <button
                className="px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-slate-800 transition"
                onClick={() => fetchFiles(currentPath)}
              >
                🔙 Back
              </button>

              <button
                className="px-4 py-2 bg-transparent border border-green-400 text-green-300 hover:bg-green-400 hover:text-slate-900 rounded transition"
                onClick={async () => {
                  setSaving(true);
                  const res = await fetch('/api/files/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      path: `${currentPath}/${fileContent.name}`,
                      content: fileContent.content,
                    }),
                  });
                  setSaving(false);
                  alert(res.ok ? '✅ Saved successfully!' : '❌ Save failed');
                }}
              >
                {saving ? '💾 Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <p className="text-lg">Select a file from the sidebar to view and edit</p>
          </div>
        )}
      </main>
    </div>
  );
}
