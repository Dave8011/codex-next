// ✅ Modernized File Browser UI with Night Toggle, Sidebar Tree, and GitHub Integration

import { useEffect, useState } from 'react';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [previewContent, setPreviewContent] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const fetchFiles = async (subpath = '') => {
    const res = await fetch(`/api/files/list?subpath=${subpath}`);
    const data = await res.json();
    setFiles(data.files || []);
    setCurrentPath(subpath);
    setFileContent(null);
  };

  const openFile = async (filename) => {
    const res = await fetch(`/api/files/open?path=${currentPath}/${filename}`);
    const data = await res.json();
    setFileContent({ name: filename, content: data.content });
  };

  const previewFile = async (filename) => {
    const res = await fetch(`/api/files/open?path=${currentPath}/${filename}`);
    const data = await res.json();
    setPreviewContent({ name: filename, content: data.content });
  };

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

  const createFile = async () => {
    if (!newFileName.trim()) return;
    await fetch('/api/files/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: `${currentPath}/${newFileName}`, content: '' }),
    });
    setNewFileName('');
    fetchFiles(currentPath);
  };

  const goBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    fetchFiles(parts.join('/'));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const theme = darkMode ? 'dark' : 'light';

  return (
    <div className={theme + " min-h-screen flex bg-gray-900 text-white font-semibold text-lg"}>
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">📂 Files</h2>
          <button
            className="text-sm underline"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '🌞' : '🌙'}
          </button>
        </div>
        {currentPath && (
          <button onClick={goBack} className="underline text-white">⬅ Back</button>
        )}
        <ul className="space-y-2">
  {files?.length > 0 ? (
    files.map((file) =>
      file.name ? (
        <li key={file.name}>
          {file.type === "folder" ? (
            <button
              className="text-blue-600 underline"
              onClick={() => fetchFiles(`${currentPath}/${file.name}`)}
            >
              📂 {file.name}
            </button>
          ) : (
            <button
              className="text-green-700 underline"
              onClick={() => openFile(file.name)}
            >
              📄 {file.name}
            </button>
          )}
        </li>
      ) : null
    )
  ) : (
    <li className="text-gray-500">No files found or failed to load.</li>
  )}
</ul>

        {/* New Folder */}
        <div className="pt-6">
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder"
            className="w-full p-2 bg-gray-700 rounded"
          />
          <button onClick={createFolder} className="w-full mt-2 bg-transparent border border-white text-white py-1 rounded">
            ➕ Create Folder
          </button>
        </div>

        {/* New File */}
        <div className="pt-4">
          <input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="New file.js"
            className="w-full p-2 bg-gray-700 rounded"
          />
          <button onClick={createFile} className="w-full mt-2 bg-transparent border border-white text-white py-1 rounded">
            ➕ Create File
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        {fileContent ? (
          <div>
            <h1 className="text-2xl mb-4">Editing: {fileContent.name}</h1>
            <textarea
              value={fileContent.content}
              onChange={(e) => setFileContent({ ...fileContent, content: e.target.value })}
              className="w-full h-96 p-4 text-white bg-[#334155] rounded shadow-md font-mono"
            />
            <button
              onClick={async () => {
                const res = await fetch('/api/files/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ path: `${currentPath}/${fileContent.name}`, content: fileContent.content }),
                });
                alert(res.ok ? '✅ Saved!' : '❌ Save failed.');
              }}
              className="mt-4 bg-transparent border border-white text-white py-2 px-4 rounded"
            >
              💾 Save
            </button>
          </div>
        ) : (
          <h1 className="text-center text-3xl opacity-50">📑 Select a file to begin editing</h1>
        )}

        {/* Preview Modal */}
        {previewContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl relative">
              <button onClick={() => setPreviewContent(null)} className="absolute top-2 right-4 text-white">✖</button>
              <h2 className="text-xl mb-2">Preview: {previewContent.name}</h2>
              <pre className="bg-[#334155] p-4 rounded overflow-auto max-h-[70vh] text-white text-sm">
                {previewContent.content}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
