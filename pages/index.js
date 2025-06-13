import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

// Monaco Editor dynamic import for SSR safety
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// Language detection based on file extension
function detectLanguage(filename = "") {
  const ext = filename.split(".").pop().toLowerCase();
  const map = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    json: "json", css: "css", scss: "scss", html: "html", htm: "html",
    md: "markdown", markdown: "markdown", py: "python", java: "java", php: "php", rb: "ruby",
    c: "c", h: "c", cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
    go: "go", rs: "rust", sh: "shell", bash: "shell", xml: "xml",
    yml: "yaml", yaml: "yaml", sql: "sql", swift: "swift"
  };
  return map[ext] || "plaintext";
}

// Get parent folder from a path
function parentPath(path) {
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

// Theme management
function useTheme() {
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("theme") || "unique" : "unique"
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  return [theme, setTheme];
}

// Modal for creating files/folders
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
    <div className="cf-modal-bg" role="dialog" aria-modal="true">
      <div className="cf-modal">
        <button onClick={onClose} className="cf-modal-close" aria-label="Close">
          &times;
        </button>
        <h2 className="cf-modal-title">
          <span className="cf-modal-icon">{type === "file" ? "📄" : "📂"}</span>
          Create {type === "file" ? "File" : "Folder"}
        </h2>
        <select value={type} onChange={e => setType(e.target.value)} className="cf-modal-select">
          <option value="file">File</option>
          <option value="folder">Folder</option>
        </select>
        <input
          type="text"
          placeholder={`Name (e.g. new${type === "file" ? "file.js" : "folder"})`}
          value={name}
          onChange={e => setName(e.target.value)}
          className="cf-modal-input"
          disabled={loading}
          aria-label="Name"
        />
        {type === "file" && (
          <textarea
            placeholder="Optional file content..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="cf-modal-textarea"
            disabled={loading}
            style={{ minHeight: 48 }}
            aria-label="File content"
          />
        )}
        {error && <div className="cf-modal-error">{error}</div>}
        <button onClick={handleCreate} disabled={loading} className="cf-modal-create">
          {loading ? <span className="cf-spinner"></span> : "➕ Create"}
        </button>
      </div>
    </div>
  );
}

export default function Index() {
  const [theme, setTheme] = useTheme();
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [fileContent, setFileContent] = useState(null); // { name, content }
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [sidebarError, setSidebarError] = useState("");
  const monacoRef = useRef(null);
  const editorRef = useRef(null);

  // Fetch files and folders
  const fetchFiles = useCallback(async (subpath = "") => {
    try {
      setSidebarError("");
      const res = await fetch(`/api/files/list?subpath=${encodeURIComponent(subpath)}`);
      if (!res.ok) throw new Error("Failed to load files.");
      const data = await res.json();
      setFiles(data.files || []);
      setCurrentPath(subpath);
      setFileContent(null);
    } catch (e) {
      setFiles([]);
      setSidebarError("Unable to load files.");
    }
  }, []);

  // Open file for editing
  const openFile = useCallback(async (filename) => {
    const fullPath = [currentPath, filename].filter(Boolean).join("/");
    try {
      const res = await fetch(`/api/files/open?path=${encodeURIComponent(fullPath)}`);
      if (!res.ok) throw new Error("Failed to open file.");
      const data = await res.json();
      setFileContent({ name: filename, content: data.content });
      setSaveStatus("");
      setCopyStatus("");
    } catch (e) {
      setFileContent(null);
      setSaveStatus("error");
    }
  }, [currentPath]);

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line
  }, [fetchFiles]);

  // Format code in Monaco
  function handleFormat() {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
    }
  }

  // Copy file code to clipboard
  const handleCopy = async () => {
    if (fileContent?.content && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fileContent.content);
        setCopyStatus("Copied!");
        setTimeout(() => setCopyStatus(""), 1500);
      } catch {
        setCopyStatus("Copy failed");
        setTimeout(() => setCopyStatus(""), 1500);
      }
    }
  };

  // THEME COLORS: unique, warm, soft, not like VS Code
  // SIDEBAR: vertical file/folder navigation with large icons, animated transitions
  // EDITOR: rounded glass panel, floating action bar, accent gradient, Monaco Editor

  return (
    <div className="cf-root">
      {/* Header */}
      <header className="cf-header">
        <span className="cf-logo"> ⮜ ⮞ Codex Panel </span>
        <div className="cf-header-actions">
          <button
            className="cf-btn cf-theme-btn"
            onClick={() => setTheme(theme === "unique" ? "light" : theme === "light" ? "dark" : "unique")}
            aria-label="Theme"
          >
            {theme === "unique" ? "🌈" : theme === "light" ? "☀️" : "🌙"}
          </button>
          <button className="cf-btn cf-new-btn" onClick={() => setShowCreate(true)}>
            ➕ New
          </button>
        </div>
      </header>

      <main className="cf-main">
        {/* Sidebar */}
        <nav className="cf-sidebar" aria-label="File navigation">
          <div className="cf-sidebar-title">Browse</div>
          {currentPath && (
            <button
              className="cf-sidebar-item cf-up"
              onClick={() => fetchFiles(parentPath(currentPath))}
              aria-label="Up one folder"
            >
              <span className="cf-sidebar-icon">⬆️</span>
              <span className="cf-sidebar-label">..</span>
            </button>
          )}
          {sidebarError ? (
            <div className="cf-sidebar-empty">{sidebarError}</div>
          ) : files.length > 0 ? (
            files.map(file => (
              <button
                key={`${currentPath}/${file.name}`}
                className={`cf-sidebar-item ${file.type === "folder" ? "cf-folder" : "cf-file"}`}
                onClick={() =>
                  file.type === "folder"
                    ? fetchFiles([currentPath, file.name].filter(Boolean).join("/"))
                    : openFile(file.name)
                }
                aria-label={file.type === "folder" ? `Open folder ${file.name}` : `Open file ${file.name}`}
              >
                <span className="cf-sidebar-icon">
                  {file.type === "folder" ? "📂" : "📄"}
                </span>
                <span className="cf-sidebar-label">{file.name}</span>
              </button>
            ))
          ) : (
            <div className="cf-sidebar-empty">No files</div>
          )}
        </nav>

        {/* Editor */}
        <section className="cf-editor">
          {fileContent ? (
            <div className="cf-editor-card">
              <div className="cf-editor-topbar">
                <span className="cf-filename">
                  {fileContent.name}
                  <span className="cf-lang-badge">{detectLanguage(fileContent.name)}</span>
                </span>
                <div className="cf-actionbar">
                  <button className="cf-action-btn" onClick={handleFormat} title="Format">
                    🧹 Format
                  </button>
                  <button className="cf-action-btn" onClick={handleCopy} title="Copy code">
                    {copyStatus ? "✅ Copied" : "📋 Copy"}
                  </button>
                  <button className="cf-action-btn" onClick={() => fetchFiles(currentPath)}>
                    ← Files
                  </button>
                </div>
              </div>
              <div className="cf-monaco-wrap">
                <MonacoEditor
                  height="75vh"
                  defaultLanguage={detectLanguage(fileContent.name)}
                  language={detectLanguage(fileContent.name)}
                  value={fileContent.content}
                  theme={theme === "unique" ? "vs-dark" : theme === "light" ? "vs-light" : "vs-dark"}
                  onChange={val => setFileContent({ ...fileContent, content: val })}
                  onMount={(editor, monaco) => {
                    monacoRef.current = monaco;
                    editorRef.current = editor;
                  }}
                  options={{
                    fontSize: 17,
                    fontFamily: "Fira Mono, Menlo, Monaco, monospace",
                    minimap: { enabled: false },
                    formatOnPaste: true,
                    formatOnType: true,
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    automaticLayout: true,
                    wordWrap: "on",
                  }}
                />
              </div>

              <div className="cf-editor-statusbar">
                <span className="cf-status-label">
                  {saveStatus === "saving" && "💾 Saving..."}
                  {saveStatus === "saved" && <span className="cf-status-saved">✅ Saved!</span>}
                  {saveStatus === "error" && <span className="cf-status-error">❌ Save failed</span>}
                </span>
                <button
                  className="cf-save-btn"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setSaveStatus("saving");
                    const fullPath = [currentPath, fileContent.name].filter(Boolean).join("/");
                    try {
                      const res = await fetch("/api/files/save", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          path: fullPath,
                          content: fileContent.content,
                        }),
                      });
                      if (res.ok) {
                        setSaveStatus("saved");
                        setTimeout(() => setSaveStatus(""), 1800);
                      } else {
                        const data = await res.json().catch(() => ({}));
                        setSaveStatus("error");
                        // Optionally show data.error here
                      }
                    } catch {
                      setSaveStatus("error");
                    }
                    setSaving(false);
                  }}
                >
                  {saving ? "💾 Saving..." : "💾 Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="cf-editor-empty">
              <span className="cf-editor-empty-icon">🗂️</span>
              <div>Choose a file to view or edit</div>
            </div>
          )}
        </section>
      </main>

      <CreateFileOrFolder
        currentPath={currentPath}
        show={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => fetchFiles(currentPath)}
      />

      {/* ...styles are the same as your current version... */}
      <style jsx global>{`
        /* ===== THEME COLORS (Unique, Warm, Soft, NOT VS Code) ===== */
        /* styles omitted for brevity, use your existing styles */
     
     
        :root,
        [data-theme="unique"] {
          --cf-bg: #272129;
          --cf-sidebar: #1e1921;
          --cf-accent: linear-gradient(90deg, #ffb86c, #ff79c6);
          --cf-accent2: #ffb86c;
          --cf-card: #35283d;
          --cf-header: #312438;
          --cf-txt: #f2dcef;
          --cf-txt2: #f8e9fc;
          --cf-muted: #a098b7;
          --cf-border: #3a3142;
          --cf-btn: #ff79c6;
          --cf-btn2: #ffb86c;
          --cf-btn-hover: #f2a5e3;
          --cf-status-good: #7dfc8a;
          --cf-status-bad: #ff4f7c;
          --cf-lang-bg: #20181e;
          --cf-shadow: 0 4px 32px 0 #22082036;
        }
        [data-theme="light"] {
          --cf-bg: #f9e9d9;
          --cf-sidebar: #fff1e5;
          --cf-accent: linear-gradient(90deg, #ffb86c, #ff79c6);
          --cf-accent2: #ffb86c;
          --cf-card: #fff7f2;
          --cf-header: #fff4e6;
          --cf-txt: #42284a;
          --cf-txt2: #7c5175;
          --cf-muted: #b18cb6;
          --cf-border: #f1cfdd;
          --cf-btn: #ff79c6;
          --cf-btn2: #ffb86c;
          --cf-btn-hover: #ffb3e1;
          --cf-status-good: #2f9e44;
          --cf-status-bad: #d7263d;
          --cf-lang-bg: #f5eaf2;
          --cf-shadow: 0 5px 25px 0 #ffc2df55;
        }
        [data-theme="dark"] {
          --cf-bg: #19171b;
          --cf-sidebar: #19171a;
          --cf-accent: linear-gradient(90deg, #80bfff, #aaffaa);
          --cf-accent2: #80bfff;
          --cf-card: #242434;
          --cf-header: #20202a;
          --cf-txt: #e1eefa;
          --cf-txt2: #7f9bbd;
          --cf-muted: #4d5c74;
          --cf-border: #222225;
          --cf-btn: #80bfff;
          --cf-btn2: #aaffaa;
          --cf-btn-hover: #4cc9f0;
          --cf-status-good: #80ffb7;
          --cf-status-bad: #f95f62;
          --cf-lang-bg: #14161c;
          --cf-shadow: 0 3px 24px 0 #3f7fff36;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: var(--cf-bg);
          color: var(--cf-txt);
          font-family: 'Fira Sans', 'Segoe UI', 'Menlo', 'Monaco', monospace;
        }
        .cf-root {
          min-height: 100vh;
          background: var(--cf-bg);
          display: flex;
          flex-direction: column;
        }
        .cf-header {
          background: var(--cf-header);
          color: var(--cf-txt2);
          padding: 0 2vw;
          height: 62px;
          min-height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 1.3rem;
          border-bottom: 1.5px solid var(--cf-border);
        }
        .cf-logo {
          font-weight: bold;
          font-size: 1.38em;
          letter-spacing: 1px;
          background: var(--cf-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cf-header-actions {
          display: flex;
          gap: 16px;
        }
        .cf-btn {
          border: none;
          padding: 9px 20px;
          font-size: 1.1em;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          color: var(--cf-txt2);
          background: var(--cf-accent);
          box-shadow: 0 2px 8px #0001;
          transition: background 0.13s, color 0.13s, box-shadow 0.12s, scale 0.12s;
        }
        .cf-btn:active { scale: 0.97; }
        .cf-btn.cf-theme-btn {
          background: var(--cf-card);
          color: var(--cf-btn);
        }
        .cf-btn.cf-theme-btn:hover {
          color: var(--cf-btn-hover);
        }
        .cf-btn.cf-new-btn {
          background: var(--cf-accent);
          color: var(--cf-card);
        }
        .cf-btn.cf-new-btn:hover {
          background: var(--cf-btn-hover);
        }

        .cf-main {
          flex: 1;
          display: flex;
          min-height: 0;
          min-width: 0;
        }
        .cf-sidebar {
          width: 290px;
          min-width: 180px;
          background: var(--cf-sidebar);
          border-right: 2px solid var(--cf-border);
          padding: 0 0 10px 0;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          box-shadow: 2px 0 24px #0002;
        }
        .cf-sidebar-title {
          font-size: 1.08em;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--cf-btn2);
          margin: 23px 0 16px 30px;
          text-shadow: 0 2px 8px #ffb86a33;
        }
        .cf-sidebar-empty {
          color: var(--cf-muted);
          font-size: 1em;
          text-align: center;
          margin-top: 30px;
        }
        .cf-sidebar-item {
          display: flex;
          align-items: center;
          padding: 13px 25px;
          background: none;
          border: none;
          color: var(--cf-txt);
          font-size: 1em;
          cursor: pointer;
          border-radius: 0 24px 24px 0;
          margin-bottom: 2px;
          font-weight: 500;
          transition: background 0.13s, color 0.13s, box-shadow 0.13s;
          position: relative;
        }
        .cf-sidebar-item:hover,
        .cf-sidebar-item:focus {
          background: var(--cf-card);
          color: var(--cf-btn);
          box-shadow: 2px 2px 16px #ffb86c11;
        }
        .cf-sidebar-icon {
          font-size: 1.24em;
          margin-right: 18px;
        }
        .cf-up { background: var(--cf-card) !important; color: var(--cf-btn2) !important; }

        .cf-editor {
          flex: 1;
          background: var(--cf-bg);
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cf-editor-card {
  width: 100%;
  max-width: 1200px;
  min-height: 700px;
  /* ...rest of your styles */
}
        .cf-editor-card {
          width: 100%;
          max-width: 850px;
          background: var(--cf-card);
          border-radius: 2.5em;
          margin: 40px 0;
          box-shadow: var(--cf-shadow);
          border: 2.5px solid var(--cf-border);
          display: flex;
          flex-direction: column;
          animation: cf-fade-in 0.7s cubic-bezier(.4,0,.2,1);
        }
        .cf-editor-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 32px 13px 32px;
          font-size: 1.12em;
        }
        .cf-filename {
          font-weight: 700;
          color: var(--cf-accent2);
          font-size: 1.15em;
          letter-spacing: 1px;
          background: none;
          border-radius: 8px;
          padding: 0 12px 0 0;
        }
        .cf-lang-badge {
          margin-left: 13px;
          font-size: 0.83em;
          font-weight: 600;
          color: var(--cf-txt2);
          background: var(--cf-lang-bg);
          border-radius: 6px;
          padding: 3px 11px;
          border: 1.5px solid var(--cf-border);
          letter-spacing: 0.5px;
        }
        .cf-actionbar {
          display: flex;
          gap: 12px;
        }
        .cf-action-btn {
          padding: 8px 18px;
          border: none;
          border-radius: 8px;
          background: var(--cf-card);
          color: var(--cf-btn2);
          font-weight: 600;
          font-size: 1em;
          cursor: pointer;
          transition: background 0.13s, color 0.13s, box-shadow 0.13s;
          border: 1.5px solid var(--cf-border);
        }
        .cf-action-btn:hover,
        .cf-action-btn:focus {
          background: var(--cf-accent2);
          color: var(--cf-card);
        }
        .cf-monaco-wrap {
          margin: 0 28px 0 28px;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 3px 24px #ffb86c18;
        }
        .cf-editor-statusbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px 21px 32px;
        }
        .cf-status-label {
          font-size: 1em;
          min-width: 100px;
        }
        .cf-status-saved { color: var(--cf-status-good); }
        .cf-status-error { color: var(--cf-status-bad); }
        .cf-save-btn {
          padding: 13px 42px;
          background: var(--cf-btn2);
          color: var(--cf-bg);
          border: none;
          border-radius: 9px;
          font-weight: 700;
          font-size: 1.11em;
          letter-spacing: 1px;
          cursor: pointer;
          box-shadow: 0 1px 6px #0002;
          transition: background 0.12s, color 0.14s;
        }
        .cf-save-btn:hover,
        .cf-save-btn:focus {
          background: var(--cf-btn-hover);
          color: var(--cf-card);
        }
        .cf-editor-empty {
          text-align: center;
          margin: 0 auto;
          color: var(--cf-muted);
          font-size: 1.25em;
          letter-spacing: 1px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
        }
        .cf-editor-empty-icon {
          font-size: 3.2em;
          margin-bottom: 25px;
          opacity: 0.7;
        }

        /* MODAL */
        .cf-modal-bg {
          position: fixed;
          z-index: 200;
          left: 0;
          top: 0;
          width: 100vw;
          height: 100vh;
          background: #0008;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .cf-modal {
          background: var(--cf-card);
          color: var(--cf-txt);
          border: 2px solid var(--cf-border);
          border-radius: 2.2em;
          box-shadow: 0 2px 32px #ffb86c66;
          padding: 44px 36px 32px 36px;
          min-width: 310px;
          max-width: 420px;
          position: relative;
          animation: cf-fade-in 0.36s cubic-bezier(.4,0,.2,1);
        }
        .cf-modal-close {
          background: none;
          border: none;
          position: absolute;
          top: 15px;
          right: 16px;
          font-size: 2.1em;
          color: var(--cf-muted);
          cursor: pointer;
        }
        .cf-modal-title {
          font-size: 1.25em;
          font-weight: bold;
          margin-bottom: 20px;
          color: var(--cf-btn2);
          letter-spacing: 0.8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cf-modal-icon { font-size: 1.3em; }
        .cf-modal-select,
        .cf-modal-input,
        .cf-modal-textarea {
          width: 100%;
          padding: 10px 13px;
          margin-bottom: 14px;
          border-radius: 9px;
          border: 1.5px solid var(--cf-border);
          font-size: 1.09em;
          background: var(--cf-sidebar);
          color: var(--cf-txt2);
        }
        .cf-modal-textarea { resize: vertical; }
        .cf-modal-error {
          color: var(--cf-status-bad);
          font-size: 1em;
          margin-bottom: 11px;
        }
        .cf-modal-create {
          width: 100%;
          padding: 13px 0;
          font-size: 1.11em;
          font-weight: bold;
          border: none;
          border-radius: 11px;
          background: var(--cf-btn2);
          color: var(--cf-bg);
          cursor: pointer;
          transition: background 0.13s;
        }
        .cf-modal-create:hover {
          background: var(--cf-btn-hover);
        }
        .cf-spinner {
          display: inline-block;
          margin-right: 11px;
          width: 18px;
          height: 18px;
          border: 2px solid #fff;
          border-top: 2px solid #ffb86c;
          border-radius: 50%;
          animation: cf-spin 0.7s linear infinite;
        }
        @keyframes cf-spin { to { transform: rotate(360deg); } }
        @keyframes cf-fade-in {
          from { opacity: 0; transform: translateY(35px);}
          to { opacity: 1; transform: none;}
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .cf-main { flex-direction: column; }
          .cf-sidebar {
            width: 100%;
            min-width: unset;
            border-right: none;
            border-bottom: 2px solid var(--cf-border);
            flex-direction: row;
            overflow-x: auto;
            padding-top: 0;
          }
          .cf-sidebar-title {
            margin: 20px 0 14px 18px;
          }
          
        }
        @media (max-width: 600px) {
          .cf-header { font-size: 1em; min-height: 48px; height: 48px; }
          .cf-logo { font-size: 1.01em; }
          .cf-main { flex-direction: column; }
          .cf-sidebar { min-width: unset; }
          .cf-editor-card {
            margin: 12px 2vw 0 2vw;
            border-radius: 0.7em;
            box-shadow: none;
          }
          .cf-editor-topbar, .cf-editor-statusbar {
            padding-left: 11px; padding-right: 11px;
          }
          .cf-monaco-wrap {
            margin-left: 6px; margin-right: 6px;
          }
        }
       `}</style>
    </div>
  );
}
