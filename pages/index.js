import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

// Monaco Editor is loaded dynamically for Next.js SSR compatibility
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// Helper for Monaco language detection
function getLanguage(filename = "") {
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "scss":
      return "scss";
    case "html":
    case "htm":
      return "html";
    case "md":
    case "markdown":
      return "markdown";
    case "py":
      return "python";
    case "java":
      return "java";
    case "php":
      return "php";
    case "rb":
      return "ruby";
    case "c":
    case "h":
      return "c";
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
      return "cpp";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "sh":
    case "bash":
      return "shell";
    case "xml":
      return "xml";
    case "yml":
    case "yaml":
      return "yaml";
    case "sql":
      return "sql";
    case "swift":
      return "swift";
    default:
      return "plaintext";
  }
}

// Helper to get parent directory
function getParentPath(path) {
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

// Theme context for toggling dark/light mode
function useTheme() {
  const [theme, setTheme] = useState(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem("theme") || "dark"
        : "dark"
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
        <input
          type="text"
          placeholder="Enter name (e.g. newfile.js)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="modal-input"
          disabled={loading}
        />
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
  const [fileContent, setFileContent] = useState(null); // { name, content }
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const monacoRef = useRef(null);
  const editorRef = useRef(null);

  // Fetch list of files/folders for a given path
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
    setCopyStatus("");
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line
  }, []);

  // Format code in Monaco
  function handleFormat() {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
    }
  }

  // Copy code to clipboard
  const handleCopy = async () => {
    if (fileContent?.content) {
      await navigator.clipboard.writeText(fileContent.content);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 1200);
    }
  };

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
            <div className="filetree-header">Sandbox</div>
            <ul className="filetree-list">
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
                <span className="editor-panel-title">
                  ✍️ <span className="editor-panel-filename">{fileContent.name}</span>
                  <span className="editor-panel-language">
                    ({getLanguage(fileContent.name)})
                  </span>
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  {/* Format Button: only show for code files */}
                  <button
                    className="editor-panel-format"
                    onClick={handleFormat}
                    title="Auto Format"
                  >
                    🪄 Format
                  </button>
                  <button
                    className="editor-panel-copy"
                    onClick={handleCopy}
                    title="Copy code"
                  >
                    {copyStatus ? "✅ Copied" : "📋 Copy"}
                  </button>
                  <button
                    className="editor-panel-back"
                    onClick={() => fetchFiles(currentPath)}
                  >
                    🔙 All Files
                  </button>
                </div>
              </div>
              {/* Monaco Editor */}
              <div style={{
                height: "540px",
                borderRadius: 8,
                overflow: "hidden",
                margin: "0 28px 18px 28px",
                boxShadow: "0 2px 12px #0002"
              }}>
                <MonacoEditor
                  height="540px"
                  defaultLanguage={getLanguage(fileContent.name)}
                  language={getLanguage(fileContent.name)}
                  value={fileContent.content}
                  theme={theme === "light" ? "vs-light" : "vs-dark"}
                  onChange={val =>
                    setFileContent({ ...fileContent, content: val })
                  }
                  onMount={(editor, monaco) => {
                    monacoRef.current = monaco;
                    editorRef.current = editor;
                  }}
                  options={{
                    fontSize: 16,
                    fontFamily: "Menlo, Monaco, Fira Mono, monospace",
                    minimap: { enabled: false },
                    formatOnPaste: true,
                    formatOnType: true,
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    automaticLayout: true,
                    wordWrap: "on",
                    scrollbar: { vertical: "auto" }
                  }}
                />
              </div>
              <div className="editor-panel-footer">
                <span className="editor-panel-status">
                  {saveStatus === "saving" && <span>💾 Saving...</span>}
                  {saveStatus === "saved" && (
                    <span className="editor-panel-saved">✅ Saved!</span>
                  )}
                  {saveStatus === "error" && (
                    <span className="editor-panel-error">❌ Save failed</span>
                  )}
                </span>
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
          --btn-gradient: linear-gradient(90deg, #ffd857 0, #eab94d 100%);
          --btn-gradient-hover: linear-gradient(90deg, #ffe187 0, #ffae42 100%);
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
          --btn-gradient: linear-gradient(90deg, #ffe187 0, #ffae42 100%);
          --btn-gradient-hover: linear-gradient(90deg, #ffd857 0, #eab94d 100%);
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
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-sidebar);
          padding: 0 22px;
          border-bottom: 1px solid var(--editor-panel-border);
          font-size: 18px;
        }
        .editor-logo {
          font-size: 18px;
          font-weight: bold;
          color: var(--accent);
          letter-spacing: 1px;
        }
        .theme-toggle {
          background: none;
          color: var(--text-main);
          border: none;
          font-size: 17px;
          cursor: pointer;
          padding: 6px 20px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .theme-toggle:hover {
          background: var(--filetree-hover);
        }

        .filemanager-container {
          display: flex;
          height: calc(100vh - 42px);
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
          padding: 18px 0 0 0;
        }
        .filetree-header {
          font-size: 16px;
          font-weight: bold;
          color: var(--accent);
          margin: 0 0 8px 18px;
          letter-spacing: 0.5px;
        }
        .filetree-list {
          list-style: none;
          padding: 0;
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
          font-size: 16px;
          padding: 5px 18px 5px 18px;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.14s, color 0.12s;
        }
        .filetree-folder:hover,
        .filetree-file:hover {
          background: var(--filetree-hover);
          color: var(--accent);
        }
        .filetree-foldericon,
        .filetree-fileicon {
          margin-right: 7px;
        }
        .filetree-createbtn {
          width: calc(100% - 34px);
          margin: 14px 16px 0 16px;
          background: var(--btn-gradient);
          color: var(--bg-main);
          border: none;
          border-radius: 6px;
          padding: 10px 0;
          font-weight: bold;
          cursor: pointer;
          font-size: 15px;
          box-shadow: 0 1px 2px #0002;
          transition: background 0.13s;
        }
        .filetree-createbtn:hover {
          background: var(--btn-gradient-hover);
        }
        .filetree-empty {
          color: var(--text-faded);
          font-size: 15px;
          padding: 8px 18px;
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
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .editor-panel-inner {
          margin: 44px 48px 0 48px;
          background: var(--bg-modal);
          border-radius: 14px;
          border: 1px solid var(--editor-panel-border);
          box-shadow: 0 0 14px #0002;
          padding: 0 0 28px 0;
          min-height: 560px;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .editor-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px 28px 10px 28px;
        }
        .editor-panel-title {
          font-size: 21px;
          font-weight: bold;
          color: var(--accent);
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .editor-panel-filename {
          color: #fff;
          margin-left: 6px;
        }
        .editor-panel-language {
          font-size: 14px;
          color: var(--text-faded);
          margin-left: 9px;
        }
        .editor-panel-back,
        .editor-panel-format,
        .editor-panel-copy {
          background: var(--bg-panel);
          border: 1px solid var(--editor-panel-border);
          border-radius: 5px;
          color: var(--text-main);
          padding: 7px 18px;
          font-size: 15px;
          cursor: pointer;
          margin-left: 0;
          margin-right: 0;
          font-weight: 500;
          transition: background 0.13s, color 0.13s;
        }
        .editor-panel-back:hover,
        .editor-panel-format:hover,
        .editor-panel-copy:hover {
          background: var(--accent);
          color: var(--bg-main);
        }
        .editor-panel-copy[disabled] {
          opacity: 0.65;
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
          background: var(--btn-gradient);
          color: var(--bg-main);
          border: none;
          border-radius: 6px;
          padding: 11px 36px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.13s;
          box-shadow: 0 2px 8px #0001;
        }
        .editor-panel-save:hover {
          background: var(--btn-gradient-hover);
        }
        .editor-panel-empty {
          margin: 60px 36px 0 36px;
          color: var(--text-faded);
          font-size: 20px;
          text-align: center;
          letter-spacing: 0.2px;
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
          padding: 38px 32px 28px 32px;
          min-width: 310px;
          max-width: 400px;
          position: relative;
        }
        .modal-close {
          background: none;
          border: none;
          position: absolute;
          top: 14px;
          right: 18px;
          font-size: 33px;
          color: var(--text-faded);
          cursor: pointer;
        }
        .modal-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 18px;
          color: var(--accent);
        }
        .modal-select,
        .modal-input,
        .modal-textarea {
          width: 100%;
          padding: 9px 13px;
          margin-bottom: 15px;
          border-radius: 6px;
          border: 1px solid var(--editor-panel-border);
          font-size: 16px;
          background: var(--bg-panel);
          color: var(--text-main);
        }
        .modal-textarea {
          min-height: 67px;
          resize: vertical;
        }
        .modal-error {
          color: #f23a42;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .modal-create {
          width: 100%;
          padding: 13px 0;
          font-size: 16px;
          font-weight: bold;
          border: none;
          border-radius: 6px;
          background: var(--btn-gradient);
          color: var(--bg-main);
          cursor: pointer;
          transition: background 0.13s;
        }
        .modal-create:hover {
          background: var(--btn-gradient-hover);
        }
        .modal-spinner {
          display: inline-block;
          margin-right: 10px;
          width: 19px;
          height: 19px;
          border: 2px solid #fff;
          border-top: 2px solid #aaa;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg);}
        }

        /* Responsive tweaks for mobile/tablet */
        @media (max-width: 1100px) {
          .editor-panel-inner {
            margin: 22px 2vw 0 2vw;
          }
        }
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
            margin: 16px 2vw 0 2vw;
            min-height: 400px;
          }
        }
        @media (max-width: 600px) {
          .editor-bar {
            font-size: 14px;
            padding: 0 7px;
          }
          .editor-panel-inner {
            margin: 12px 0 0 0;
            min-height: 220px;
            padding: 0 0 10px 0;
          }
          .editor-panel-header,
          .editor-panel-footer {
            padding-left: 7px;
            padding-right: 7px;
          }
          .editor-panel-empty {
            margin: 24px 12px 0 12px;
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
}
