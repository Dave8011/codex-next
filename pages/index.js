import { useEffect, useState } from 'react';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState(null);

  const fetchFiles = async (subpath = '') => {
    const res = await fetch(`/api/files/list?subpath=${subpath}`);
    const data = await res.json();
    setFiles(data.files);
    setCurrentPath(subpath);
  };

  const openFile = async (filename) => {
    const res = await fetch(`/api/files/open?path=${currentPath}/${filename}`);
    const data = await res.json();
    setFileContent({ name: filename, content: data.content });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📁 Files in /Codex/codes/{currentPath}</h1>

      <ul className="space-y-2">
        {files?.length > 0 ? (
          files.map((file) => (
            <li key={file.name}>
              {file.type === 'folder' ? (
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
          ))
        ) : (
          <li className="text-gray-500">No files found or failed to load.</li>
        )}
      </ul>

      {fileContent && (
        <div className="mt-6 border p-4 rounded bg-gray-100">
          <h2 className="font-semibold mb-2">📝 Editing: {fileContent.name}</h2>
          <textarea
            className="w-full h-60 p-2 border rounded"
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
  );
}
