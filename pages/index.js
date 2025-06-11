import { useEffect, useState } from 'react';

// Helper to get the parent path
function getParentPath(path) {
  if (!path) return '';
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
}

// Modern Create File/Folder Component (Modal style)
function CreateFileOrFolder({ currentPath, onCreated, show, onClose }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('file');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setName('');
      setType('file');
      setContent('');
      setError('');
    }
  }, [show]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, subpath: currentPath, content }),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated();
        setName('');
        setContent('');
        onClose();
      } else {
        setError(data.error || 'Failed to create.');
      }
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl"
        >
          &times;
        </button>
        <h2 className="text-2xl mb-4 text-blue-200 font-bold flex items-center gap-2">
          <span>{type === 'file' ? '🗎' : '📁'}</span>
          Create new {type}
        </h2>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white mb-3"
        >
          <option value="file">File</option>
          <option value="folder">Folder</option>
        </select>
        <input
          type="text"
          placeholder="Enter name (e.g. newfile.js)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-slate-800 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        {type === 'file' && (
          <textarea
            placeholder="Optional content..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full mb-2 p-2 h-20 rounded bg-slate-800 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        )}
        {error && <div className="text-red-400 mb-2 text-sm">{error}</div>}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60 shadow"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          ➕ Create
        </button>
      </div>
    </div>
  );
}

export default function FileManager() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Fetch list of files/folders for a given path
  const fetchFiles = async (subpath = '') => {
    const res = await fetch(`/api/files/list?subpath=${encodeURIComponent(subpath)}`);
    const data = await res.json();
    setFiles(data.files || []);
    setCurrentPath(subpath);
    setFileContent(null); // reset content when navigating
  };

  // Open and read file contents
  const openFile = async (filename) => {
    const fullPath = [currentPath, filename].filter(Boolean).join('/');
    const res = await fetch(`/api/files/open?path=${encodeURIComponent(fullPath)}`);
    const data = await res.json();
    setFileContent({ name: filename, content: data.content });
    setSaveStatus('');
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line
  }, []);

  // Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-medium p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto bg-slate-900/90 rounded-2xl shadow-2xl p-8 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-blue-300 drop-shadow flex items-center gap-2">
            <span className="inline-block align-middle">📁</span> Codex File Manager
          </h1>
          <div className="flex gap-4">
            {currentPath && (
              <button
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white flex items-center gap-2 shadow"
                onClick={() => fetchFiles(getParentPath(currentPath))}
              >
                ⬆️ Up one level
                <span className="text-xs text-slate-400 ml-1 italic">{getParentPath(currentPath) || 'root'}</span>
              </button>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow flex items-center gap-2"
            >
              ➕ New File/Folder
            </button>
          </div>
        </div>

        {!fileContent ? (
          <>
            <ul className="space-y-2 mb-8">
              {files.length > 0 ? (
                files.map((file) => (
                  <li key={file.name}>
                    {file.type === 'folder' ? (
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-blue-200 hover:bg-blue-950/40 text-left font-semibold"
                        onClick={() => fetchFiles([currentPath, file.name].filter(Boolean).join('/'))}
                      >
                        <span>📂</span> <span className="truncate">{file.name}</span>
                      </button>
                    ) : (
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition hover:bg-green-950/40 text-green-200 text-left"
                        onClick={() => openFile(file.name)}
                      >
                        <span>🗎</span> <span className="truncate">{file.name}</span>
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <li className="text-slate-400 px-2 py-2">No files found or failed to load.</li>
              )}
            </ul>
          </>
        ) : (
          <div className="bg-slate-700/80 p-6 rounded-2xl shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                ✍️ <span className="text-yellow-300">{fileContent.name}</span>
              </h2>
              <button
                className="px-4 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-slate-800 transition"
                onClick={() => fetchFiles(currentPath)}
              >
                🔙 All Files
              </button>
            </div>
            <textarea
              className="w-full h-64 p-3 mb-4 rounded-xl bg-slate-900/90 text-white font-mono border border-slate-600 focus:ring-2 focus:ring-blue-400 shadow-inner transition"
              value={fileContent.content}
              onChange={(e) =>
                setFileContent({ ...fileContent, content: e.target.value })
              }
            />
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300 h-6">
                {saveStatus === 'saving' && <span>💾 Saving...</span>}
                {saveStatus === 'saved' && <span className="text-green-400">✅ Saved!</span>}
                {saveStatus === 'error' && <span className="text-red-400">❌ Save failed</span>}
              </div>
              <button
                className="px-6 py-2 bg-green-500 border border-green-400 text-white font-bold hover:bg-green-400 hover:text-slate-900 rounded-xl transition shadow"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setSaveStatus('saving');
                  const fullPath = [currentPath, fileContent.name].filter(Boolean).join('/');
                  const res = await fetch('/api/files/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      path: fullPath,
                      content: fileContent.content,
                    }),
                  });
                  setSaving(false);
                  if (res.ok) {
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus(''), 2000);
                  } else {
                    setSaveStatus('error');
                  }
                }}
              >
                {saving ? '💾 Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        )}
      </div>
      <CreateFileOrFolder
        currentPath={currentPath}
        show={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => fetchFiles(currentPath)}
      />
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px);}
          to { opacity: 1; transform: none;}
        }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.4,0,0.2,1); }
      `}</style>
    </div>
  );
}
