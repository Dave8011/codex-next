import { useState } from 'react';


// Modern Create File/Folder Component
function CreateFileOrFolder({ currentPath, onCreated }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('file');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      } else {
        setError(data.error || 'Failed to create.');
      }
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  };

  return (
    <div className="mb-6 p-5 rounded-2xl bg-white/10 backdrop-blur-md shadow-lg border border-slate-700 animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>{type === 'file' ? '🗎' : '📁'}</span>
          Create new {type}
        </h2>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white"
        >
          <option value="file">File</option>
          <option value="folder">Folder</option>
        </select>
      </div>
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
  );
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-medium">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-slate-900/90 border-r border-slate-700 p-4 shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center tracking-tight text-blue-300 drop-shadow">
          <span className="inline-block align-middle">📁</span> Codex Files
        </h1>
        <CreateFileOrFolder currentPath={currentPath} onCreated={() => fetchFiles(currentPath)} />
        <ul className="space-y-1 max-h-[70vh] overflow-y-auto">
          {files.length > 0 ? (
            files.map((file) => (
              <li key={file.name}>
                {file.type === 'folder' ? (
                  <button
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                      `${currentPath}/${file.name}`.replace(/^\/+/, '') === currentPath
                        ? 'bg-blue-800/30'
                        : 'hover:bg-blue-800/20'
                    } text-blue-300 font-semibold`}
                    onClick={() => fetchFiles([currentPath, file.name].filter(Boolean).join('/'))}
                  >
                    <span>📂</span> {file.name}
                  </button>
                ) : (
                  <button
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition hover:bg-green-800/20 text-green-300"
                    onClick={() => openFile(file.name)}
                  >
                    <span>🗎</span> {file.name}
                  </button>
                )}
              </li>
            ))
          ) : (
            <li className="text-slate-400 px-2 py-2">No files found or failed to load.</li>
          )}
        </ul>
      </aside>

      {/* Editor Panel */}
      <main className="flex-1 p-6 flex flex-col items-center justify-start bg-gradient-to-br from-slate-800/70 to-slate-900/90">
        {fileContent ? (
          <div className="bg-slate-700/80 p-6 rounded-2xl shadow-2xl max-w-4xl w-full animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                ✍️ <span className="text-yellow-300">{fileContent.name}</span>
              </h2>
              <button
                className="px-4 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-slate-800 transition"
                onClick={() => fetchFiles(currentPath)}
              >
                🔙 Back
              </button>
            </div>
            <textarea
              className="w-full h-64 p-3 mb-3 rounded-xl bg-slate-900/90 text-white font-mono border border-slate-600 focus:ring-2 focus:ring-blue-400 shadow-inner transition"
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
        ) : (
          <div className="text-center text-slate-400 mt-32">
            <p className="text-lg">Select a file from the sidebar to view and edit</p>
          </div>
        )}
      </main>
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
