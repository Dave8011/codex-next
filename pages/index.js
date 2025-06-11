import { useEffect, useState } from 'react';

export default function Home() {
  // Files in the current directory
  const [files, setFiles] = useState([]);

  // Track the current folder path
  const [currentPath, setCurrentPath] = useState('');

  // File content for editing
  const [fileContent, setFileContent] = useState(null);

  // For new folder or file creation
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');

  // Preview modal state
  const [previewContent, setPreviewContent] = useState(null);

  // Fetch files from API
  const fetchFiles = async (subpath = '') => {
    const res = await fetch(`/api/files/list?subpath=${subpath}`);
    const data = await res.json();
    setFiles(data.files);
    setCurrentPath(subpath);
  };

  // Fetch file for editing
  const openFile = async (filename) => {
    const res = await fetch(`/api/files/open?path=${currentPath}/${filename}`);
    const data = await res.json();
    setFileContent({ name: filename, content: data.content });
  };

  // Preview file content in a modal
  const previewFile = async (filename) => {
    const res = await fetch(`/api/files/open?path=${currentPath}/${filename}`);
    const data = await res.json();
    setPreviewContent({ name: filename, content: data.content });
  };

  // Create a new folder using the GitHub API
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

  // Create a new file with empty content
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

  // Load files on initial load
  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen p-4 bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-blue-800">
          📁 File Browser: `/Codex/Codes{currentPath && `/${currentPath}`}`
        </h1>

        {/* Create Folder */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            className="p-2 border rounded w-full sm:w-1/2"
            placeholder="📁 New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <button
            onClick={createFolder}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ➕ Create Folder
          </button>
        </div>

        {/* Create File */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            className="p-2 border rounded w-full sm:w-1/2"
            placeholder="📝 New file name (e.g. file.js)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <button
            onClick={createFile}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            📄 Create File
          </button>
        </div>

        {/* File & Folder List */}
        <ul className="space-y-2 bg-white p-4 rounded shadow">
          {files?.length > 0 ? (
            files.map((file) => (
              <li key={file.name} className="flex justify-between items-center">
                {file.type === 'folder' ? (
                  <button
                    className="text-blue-700 underline"
                    onClick={() => fetchFiles(`${currentPath}/${file.name}`)}
                  >
                    📁 {file.name}
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <button
                      className="text-green-800 underline"
                      onClick={() => openFile(file.name)}
                    >
                      ✏️ Edit: {file.name}
                    </button>
                    <button
                      className="text-gray-600 underline"
                      onClick={() => previewFile(file.name)}
                    >
                      👁️ Preview
                    </button>
                  </div>
                )}
              </li>
            ))
          ) : (
            <li className="text-gray-500">No files found or failed to load.</li>
          )}
        </ul>

        {/* Preview Modal */}
        {previewContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white p-6 rounded max-w-2xl w-full shadow-lg relative">
              <h2 className="text-lg font-bold mb-2">👁️ Preview: {previewContent.name}</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                {previewContent.content}
              </pre>
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
                onClick={() => setPreviewContent(null)}
              >
                ❌
              </button>
            </div>
          </div>
        )}

        {/* Edit Panel */}
        {fileContent && (
          <div className="mt-6 border p-4 rounded bg-white shadow">
            <h2 className="font-semibold mb-2">📝 Editing: {fileContent.name}</h2>
            <textarea
              className="w-full h-60 p-2 border rounded font-mono text-sm"
              value={fileContent.content}
              onChange={(e) =>
                setFileContent({ ...fileContent, content: e.target.value })
              }
            />
            <button
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                  alert('✅ File saved!');
                } else {
                  alert('❌ Failed to save file.');
                }
              }}
            >
              💾 Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
