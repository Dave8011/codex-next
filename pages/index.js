import { useEffect, useState } from "react";

// Helper to get parent directory path from current path
function getParentPath(path) {
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

// Theme context for toggling dark/light mode
function useTheme() {
  // Default to dark, use persisted value if exists
  const [theme, setTheme] = useState(
    () => typeof window !== "undefined" ? (localStorage.getItem("theme") || "dark") : "dark"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return [theme, setTheme];
}

// Modal dialog for creating files/folders
function CreateFileOrFolder({ currentPath, onCreated, show, onClose }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("file");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setName("");
      setType("file");
      setContent("");
      setError("");
    }
  }, [show]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/files/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, subpath: currentPath, content }),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated();
        setName("");
        setContent("");
        onClose();
      } else {
        setError(data.error || "Failed to create.");
      }
    } catch (err) {
      setError("Network error.");
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="modal-bg">
      <div className="modal">
        {/* Close (X) Button */}
        <button
          onClick={onClose}
          className="modal-close"
          aria-label="Close"
        >
          &times;
        </button>
        {/* Title and type selector */}
        <h2 className="modal-title">
          <span>{type === "file" ? "🗎" : "📁"}</span> Create new {type}
        </h2>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="modal-select"
        >
          <option value="file">File</option>
          <option value="folder">Folder</option>
        </select>
        {/* Name input */}
        <input
          type="text"
          placeholder="Enter name (e.g. newfile.js)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="modal-input"
          disabled={loading}
        />
        {/* Optional content for files */}
        {type === "file" && (
          <textarea
            placeholder="Optional content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="modal-textarea"
            disabled={loading}
          />
        )}
        {error && <div className="modal-error">{error}</div>}
        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="modal-create"
        >
          {loading && <span className="modal-spinner"></span>}
          ➕ Create
        </button>
      </div>
    </div>
  );
}

export default function FileManager() {
  const [theme, setTheme] = useTheme();
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [fileContent, setFileContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Fetch a list of files/folders for a given path
  const fetchFiles = async (subpath = "") => {
    const res = await fetch(`/api/files/list?subpath=${encodeURIComponent(subpath)}`);
    const data = await res.json();
    setFiles(data.files || []);
    setCurrentPath(subpath);
    setFileContent(null); // reset content when navigating
  };

  // Open and read file contents
  const openFile = async (filename) => {
    const fullPath = [currentPath, filename].filter(Boolean).join("/");
    const res = await fetch(`/api/files/open?path=${encodeURIComponent(fullPath)}`);
    const data = await res.json();
    setFileContent({ name: filename, content: data.content });
    setSaveStatus("");
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line
  }, []);

  // --- MAIN UI ---
  return (
    <div className="editor-wrap">
      {/* Top Bar: Title and Theme Toggle */}
      <div className="editor-bar">
        <span className="editor-logo">G&#8203;oto Files</span>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle dark/light mode"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
      <div className="filemanager-container">
        {/* Sidebar-like Folder Tree */}
        <div className="filetree">
          <div className="filetree-section">
            {/* Change the string below to update the top-level folder label */}
            <div className="filetree-header">Sandbox</div>
            <ul className="filetree-list">
              {/* Show "Up" button for navigation if not in root */}
              {currentPath && (
                <li>
                  <button
                    className="filetree-folder"
                    onClick={() => fetchFiles(getParentPath(currentPath))}
                  >
                    <span className="filetree-foldericon">⬆️</span>
                    <span className="filetree-foldername">..</span>
                  </button>
                </li>
              )}
              {/* List directories and files */}
              {files.length > 0 ? (
                files.map((file) => (
                  <li key={file.name}>
                    {file.type === "folder" ? (
                      <button
                        className="filetree-folder"
                        onClick={() =>
                          fetchFiles(
                            [currentPath, file.name].filter(Boolean).join("/")
                          )
                        }
                      >
                        <span className="filetree-foldericon">📁</span>
                        <span className="filetree-foldername">{file.name}</span>
                      </button>
                    ) : (
                      <button
                        className="filetree-file"
                        onClick={() => openFile(file.name)}
                      >
                        <span className="filetree-fileicon">🗎</span>
                        <span className="filetree-filename">{file.name}</span>
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <li className="filetree-empty">No files found.</li>
              )}
            </ul>
            {/* New file/folder button */}
            <button className="filetree-createbtn" onClick={() => setShowCreate(true)}>
              ➕ New File/Folder
            </button>
          </div>
        </div>
        {/* Editor Panel */}
        <div className="editor-panel">
          {fileContent ? (
            <div className="editor-panel-inner">
              <div className="editor-panel-header">
                {/* File name and back button */}
                <span className="editor-panel-title">
                  ✍️ <span className="editor-panel-filename">{fileContent.name}</span>
                </span>
                <button
                  className="editor-panel-back"
                  onClick={() => fetchFiles(currentPath)}
                >
                  🔙 All Files
                </button>
              </div>
              {/* Main text/code area */}
              <textarea
                className="editor-panel-textarea"
                value={fileContent.content}
                onChange={(e) =>
                  setFileContent({ ...fileContent, content: e.target.value })
                }
              />
              <div className="editor-panel-footer">
                {/* Save status area */}
                <span className="editor-panel-status">
                  {saveStatus === "saving" && <span>💾 Saving...</span>}
                  {saveStatus === "saved" && (
                    <span className="editor-panel-saved">✅ Saved!</span>
                  )}
                  {saveStatus === "error" && (
                    <span className="editor-panel-error">❌ Save failed</span>
                  )}
                </span>
                {/* Save button */}
                <button
                  className="editor-panel-save"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setSaveStatus("saving");
                    const fullPath = [currentPath, fileContent.name]
                      .filter(Boolean)
                      .join("/");
                    const res = await fetch("/api/files/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        path: fullPath,
                        content: fileContent.content,
                      }),
                    });
                    setSaving(false);
                    if (res.ok) {
                      setSaveStatus("saved");
                      setTimeout(() => setSaveStatus(""), 2000);
                    } else {
                      setSaveStatus("error");
                    }
                  }}
                >
                  {saving ? "💾 Saving..." : "💾 Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="editor-panel-empty">
              <p>Select a file from the sidebar to view and edit</p>
            </div>
          )}
        </div>
      </div>
      {/* Modal for file/folder creation */}
      <CreateFileOrFolder
        currentPath={currentPath}
        show={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => fetchFiles(currentPath)}
      />
      {/* 
        ===== STYLE SECTION =====
        You can tweak colors, font sizes, spacing, and other layout in this section.
        For adding more accent colors, see the :root CSS variables.
        For more panels: duplicate .filetree or .editor-panel and adjust flex.
        For icons: swap out the emoji for SVGs or your own icon fonts.
        For further dark/light tweaks, use [data-theme="light"] CSS block.
      */}
      <style jsx global>{`
        /* Theme color variables for dark and light mode */
        :root {
          --bg-main: #181414;
          --bg-panel: #231f1f;
          --bg-sidebar: #1c1917;
          --bg-modal: #2b2626;
          --text-main: #ede4d3;
          --text-faded: #bbb;
          --filetree-hover: #32302f;
          --editor-panel-border: #3d3535;
          --accent: #ffd857;
          --filetree-folder: #e7d37a;
        }
        [data-theme="light"] {
          --bg-main: #f3ece6;
          --bg-panel: #fff;
          --bg-sidebar: #f1ede7;
          --bg-modal: #e8e4e0;
          --text-main: #3d3535;
          --text-faded: #6d6b68;
          --filetree-hover: #ece2c6;
          --editor-panel-border: #d3beac;
          --accent: #af7e1c;
          --filetree-folder: #af7e1c;
        }

        body,
        html {
          background: var(--bg-main);
          color: var(--text-main);
          font-family: Menlo, Monaco, "Fira Mono", "Liberation Mono", "Consolas", "Courier New", monospace;
        }
        .editor-wrap {
          min-height: 100vh;
          background: var(--bg-main);
        }
        .editor-bar {
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-sidebar);
          padding: 0 18px;
          border-bottom: 1px solid var(--editor-panel-border);
        }
        .editor-logo {
          font-size: 15px;
          font-weight: bold;
          color: var(--accent);
          letter-spacing: 1px;
        }
        .theme-toggle {
          background: none;
          color: var(--text-main);
          border: none;
          font-size: 15px;
          cursor: pointer;
        }

        .filemanager-container {
          display: flex;
          height: calc(100vh - 36px);
        }
        .filetree {
          width: 260px;
          min-width: 200px;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--editor-panel-border);
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .filetree-section {
          padding: 10px 0 0 0;
        }
        .filetree-header {
          font-size: 15px;
          font-weight: bold;
          color: var(--accent);
          margin: 0 0 4px 18px;
        }
        .filetree-list {
          list-style: none;
          padding: 0 0 0 0;
          margin: 0;
        }
        .filetree-folder,
        .filetree-file {
          width: 100%;
          background: none;
          border: none;
          color: var(--text-main);
          text-align: left;
          display: flex;
          align-items: center;
          font-size: 15px;
          padding: 3px 18px 3px 18px;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.14s;
        }
        .filetree-folder:hover,
        .filetree-file:hover {
          background: var(--filetree-hover);
        }
        .filetree-foldericon,
        .filetree-fileicon {
          margin-right: 6px;
        }
        .filetree-createbtn {
          width: calc(100% - 32px);
          margin: 10px 16px 0 16px;
          background: var(--accent);
          color: var(--bg-main);
          border: none;
          border-radius: 4px;
          padding: 6px 0;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.14s;
        }
        .filetree-createbtn:hover {
          background: #ffe187;
        }
        .filetree-empty {
          color: var(--text-faded);
          font-size: 14px;
          padding: 6px 18px;
        }
        .filetree-foldername,
        .filetree-filename {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .editor-panel {
          flex: 1;
          background: var(--bg-panel);
          padding: 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .editor-panel-inner {
          margin: 32px 36px 0 36px;
          background: var(--bg-modal);
          border-radius: 10px;
          border: 1px solid var(--editor-panel-border);
          box-shadow: 0 0 10px #0002;
          padding: 0 0 24px 0;
          min-height: 520px;
          display: flex;
          flex-direction: column;
        }
        .editor-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 28px 8px 28px;
        }
        .editor-panel-title {
          font-size: 20px;
          font-weight: bold;
          color: var(--accent);
        }
        .editor-panel-filename {
          color: #fff;
        }
        .editor-panel-back {
          background: none;
          border: 1px solid var(--editor-panel-border);
          border-radius: 4px;
          color: var(--text-main);
          padding: 5px 18px;
          font-size: 15px;
          cursor: pointer;
          transition: background 0.14s;
        }
        .editor-panel-back:hover {
          background: var(--filetree-hover);
        }
        .editor-panel-textarea {
          width: calc(100% - 56px);
          margin: 0 28px 10px 28px;
          height: 340px;
          background: var(--bg-panel);
          color: var(--text-main);
          font-size: 15px;
          font-family: inherit;
          border: 1px solid var(--editor-panel-border);
          border-radius: 6px;
          padding: 15px;
          resize: vertical;
          outline: none;
        }
        .editor-panel-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 28px;
        }
        .editor-panel-status {
          min-width: 80px;
          font-size: 15px;
        }
        .editor-panel-saved {
          color: #38d94d;
        }
        .editor-panel-error {
          color: #f23a42;
        }
        .editor-panel-save {
          background: var(--accent);
          color: var(--bg-main);
          border: none;
          border-radius: 4px;
          padding: 7px 24px;
          font-weight: bold;
          font-size: 15px;
          cursor: pointer;
          transition: background 0.14s;
        }
        .editor-panel-save:hover {
          background: #ffe187;
        }
        .editor-panel-empty {
          margin: 48px 32px 0 32px;
          color: var(--text-faded);
          font-size: 18px;
          text-align: center;
        }

        /* Modal styles */
        .modal-bg {
          position: fixed;
          z-index: 100;
          left: 0;
          top: 0;
          width: 100vw;
          height: 100vh;
          background: #0008;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal {
          background: var(--bg-modal);
          color: var(--text-main);
          border: 1px solid var(--editor-panel-border);
          border-radius: 12px;
          box-shadow: 0 2px 32px #0006;
          padding: 32px 28px 24px 28px;
          min-width: 290px;
          max-width: 340px;
          position: relative;
        }
        .modal-close {
          background: none;
          border: none;
          position: absolute;
          top: 10px;
          right: 14px;
          font-size: 28px;
          color: var(--text-faded);
          cursor: pointer;
        }
        .modal-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 16px;
          color: var(--accent);
        }
        .modal-select,
        .modal-input,
        .modal-textarea {
          width: 100%;
          padding: 7px 10px;
          margin-bottom: 12px;
          border-radius: 5px;
          border: 1px solid var(--editor-panel-border);
          font-size: 15px;
          background: var(--bg-panel);
          color: var(--text-main);
        }
        .modal-textarea {
          min-height: 65px;
          resize: vertical;
        }
        .modal-error {
          color: #f23a42;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .modal-create {
          width: 100%;
          padding: 10px 0;
          font-size: 15px;
          font-weight: bold;
          border: none;
          border-radius: 4px;
          background: var(--accent);
          color: var(--bg-main);
          cursor: pointer;
          transition: background 0.14s;
        }
        .modal-create:hover {
          background: #ffe187;
        }
        .modal-spinner {
          display: inline-block;
          margin-right: 8px;
          width: 18px;
          height: 18px;
          border: 2px solid #fff;
          border-top: 2px solid #aaa;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg);}
        }

        /* Responsive tweaks for mobile/tablet */
        @media (max-width: 900px) {
          .filemanager-container {
            flex-direction: column;
          }
          .filetree {
            width: 100%;
            min-width: unset;
            border-right: none;
            border-bottom: 1px solid var(--editor-panel-border);
            flex-direction: row;
            overflow-x: auto;
          }
          .editor-panel-inner {
            margin: 24px 5vw 0 5vw;
            min-height: 420px;
          }
        }
        @media (max-width: 600px) {
          .editor-bar {
            font-size: 13px;
            padding: 0 7px;
          }
          .editor-panel-inner {
            margin: 16px 0 0 0;
            min-height: 220px;
            padding: 0 0 10px 0;
          }
          .editor-panel-header,
          .editor-panel-footer {
            padding-left: 7px;
            padding-right: 7px;
          }
          .editor-panel-textarea {
            margin-left: 7px;
            margin-right: 7px;
            height: 120px;
          }
        }
      `}</style>
    </div>
  );
}
