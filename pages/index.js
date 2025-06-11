import { useEffect, useState } from 'react';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [previewContent, setPreviewContent] = useState(null);

  // Fetch the list of files/folders
  const fetchFiles = async (subpath = '') => {
    const res = await fetch(`/api/files/list?subpath=${subpath}`);
    const data = await res.json();
    setFiles(data.files);
    setCurrentPath(subpath);
    setFileContent(null);
  };

  // Open file in editable mode
  const openFile = async (filename) => {
    const res = await fetch(`/api/files/open?path=${currentPath}/${filename}`);
    const data = await res.json();
    setFileContent({ name: filename, content: data.content });
  };

  // Preview file in read-only modal
  const previewFile = async (filename) => {
    const res = await fetch(`/api/files/open?path=${currentPath}/${filename}`);
    const data = await res.json();
    setPreviewContent({ name: filename, content: data.content });
  };

  // Create a folder via API (adds .gitkeep)
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    await fetch('/api/files/create-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: `${currentPath}/${newFolderName}` }),
    });
    setNewFolderName('');
    fetchFiles(currentPath);
  };

  // Create empty file via GitHub API
  const createFile = async () => {
    if (!newFileName.trim()) return;
    await fetch('/api/files/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: `${currentPath}/${newFileName}`,
        content: '',
      }),
    });
    setNewFileName('');
    fetchFiles(currentPath);
  };

  // Handle folder back navigation
  const goBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    fetchFiles(parts.join('/'));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto">
        {/* App Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-700">🧠 Codex Browser</h1>
          <p className="text-lg mt-2 text-gray-600">Explore, edit, and manage your files in style.</p>
        </header>

        {/* Back Button */}
        {currentPath && (
          <div className="mb-4">
            <button
              onClick={goBack}
              className="text-sm text-blue-600 hover:underline mb-2"
            >
              ⬅️ Back
            </button>
            <p className="text-sm text-gray-500">Current path: <code>{`/Codex/Codes/${currentPath}`}</code></p>
          </div>
        )}

        {/* File Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Folder Creator */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="📁 New folder"
              className="flex-1 p-2 border rounded"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button
              onClick={createFolder}
              className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
            >
              ➕
            </button>
          </div>

          {/* File Creator */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="📝 New file (e.g. hello.js)"
              className="flex-1 p-2 border rounded"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <button
              onClick={createFile}
              className="bg-green-600 text-white px-4 rounded hover:bg-green-700"
            >
              ➕
            </button>
          </div>
        </div>

        {/* File List */}
        <ul className="bg-white shadow-md rounded p-4 space-y-2">
          {files?.length ? (
            files.map((file) => (
              <li key={file.name} className="flex justify-between items-center">
                {file.type === 'folder' ? (
                  <button
                    className="text-blue-600 font-medium hover:underline"
                    onClick={() => fetchFiles(`${currentPath}/${file.name}`)}
                  >
                    📁 {file.name}
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button
                      className="text-green-700 hover:underline"
                      onClick={() => openFile(file.name)}
                    >
                      ✏️ Edit: {file.name}
                    </button>
                    <button
                      className="text-gray-500 hover:underline"
                      onClick={() => previewFile(file.name)}
                    >
                      👁️ Preview
                    </button>
                  </div>
                )}
              </li>
            ))
          ) : (
            <li className="text-gray-400">No files found</li>
          )}
        </ul>

        {/* Preview Modal */}
        {previewContent && (
          <div className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white max-w-2xl w-full rounded-lg shadow-lg p-6 relative">
              <h2 className="text-xl font-semibold mb-4">👁️ Preview: {previewContent.name}</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm whitespace-pre-wrap">
                {previewContent.content}
              </pre>
              <button
                onClick={() => setPreviewContent(null)}
                className="absolute top-2 right-4 text-gray-400 hover:text-red-500"
              >
                ✖️
              </button>
            </div>
          </div>
        )}

        {/* Editor */}
        {fileContent && (
          <div className="mt-8 bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">📝 Editing: {fileContent.name}</h2>
            <textarea
              className="w-full h-64 p-3 border rounded font-mono text-sm"
              value={fileContent.content}
              onChange={(e) =>
                setFileContent({ ...fileContent, content: e.target.value })
              }
            />
            <button
              className="mt-4 px-6 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
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
                  alert('❌ Save failed.');
                }
              }}
            >
              💾 Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
