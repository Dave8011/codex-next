// HOME PAGE

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
    yml: "yaml", yaml: "yaml", sql: "sql", swift: "swift", txt: "txt"
  };
  return map[ext] || "plaintext";
}

// Supported file extensions for dropdown
const FILE_EXTENSIONS = [
  "js", "jsx", "ts", "tsx", "json", "css", "scss", "html", "md", "py", "java",
  "php", "rb", "c", "cpp", "go", "rs", "sh", "xml", "yml", "yaml", "sql", "swift", "txt"
];

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
  const [extension, setExtension] = useState("js");

  useEffect(() => {
    if (show) {
      setName("");
      setType("file");
      setContent("");
      setError("");
      setExtension("js");
    }
  }, [show]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    const ext = val.split(".").length > 1 ? val.split(".").pop().toLowerCase() : "";
    if (FILE_EXTENSIONS.includes(ext)) setExtension(ext);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let finalName = name.trim();
      if (type === "file") {
        if (!finalName.endsWith(`.${extension}`)) {
          if (finalName.includes(".")) {
            finalName = finalName.replace(/\.[^.]+$/, `.${extension}`);
          } else {
            finalName = `${finalName}.${extension}`;
          }
        }
      }
      const res = await fetch("/api/files/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalName, type, subpath: currentPath, content }),
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
        {type === "file" ? (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Name (without extension)"
                value={name}
                onChange={handleNameChange}
                className="cf-modal-input"
                disabled={loading}
                aria-label="File name"
                style={{ flex: 1 }}
              />
              <select
                value={extension}
                onChange={e => setExtension(e.target.value)}
                className="cf-modal-select"
                disabled={loading}
                style={{ width: 110 }}
              >
                {FILE_EXTENSIONS.map(ext => (
                  <option key={ext} value={ext}>.{ext}</option>
                ))}
              </select>
            </div>
            {(name || extension) && (
              <div style={{ color: "var(--cf-muted)", marginBottom: 8, fontSize: "0.98em" }}>
                Detected type: <b>{detectLanguage(`${name || "file"}.${extension}`)}</b>
              </div>
            )}
          </>
        ) : (
          <input
            type="text"
            placeholder={`Name (e.g. newfolder)`}
            value={name}
            onChange={e => setName(e.target.value)}
            className="cf-modal-input"
            disabled={loading}
            aria-label="Folder name"
            style={{ marginBottom: 16 }}
          />
        )}
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

  function handleFormat() {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
    }
  }

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

  // Hamburger menu: for mobile, toggles sidebar (expand/collapse logic can be added)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 600;

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
        <nav className={`cf-sidebar ${sidebarOpen ? "" : "cf-sidebar-collapsed"}`} aria-label="File navigation">
          <div className="cf-sidebar-title">
            <span className="cf-sidebar-menu" onClick={() => setSidebarOpen(!sidebarOpen)} tabIndex={0} aria-label="Toggle menu" role="button">
              <span className="cf-hamburger"></span>
            </span>
            <span className="cf-sidebar-title-text">Browse</span>
          </div>
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
            files
              .filter(file => file.name !== '.gitkeep')
              .map(file => (
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
                  height="100%"
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

      <style jsx global>{`
/* ===== THEME COLORS (Unique, Warm, Soft, NOT VS Code) ===== */
/* ...all your theme and base styles remain unchanged... */

/* --- Hamburger Menu for Mobile Sidebar --- */
.cf-sidebar-menu {
  display: none;
  cursor: pointer;
  margin-right: 6px;
  vertical-align: middle;
}
.cf-hamburger, .cf-hamburger:before, .cf-hamburger:after {
  content: '';
  display: block;
  width: 22px;
  height: 4px;
  background: var(--cf-btn2);
  border-radius: 2px;
  margin: 4px 0;
  transition: all 0.2s;
  position: relative;
}
.cf-hamburger {
  position: relative;
  height: 18px;
  margin: 0;
}
.cf-hamburger:before {
  position: absolute;
  top: -7px;
}
.cf-hamburger:after {
  position: absolute;
  top: 7px;
}
@media (max-width: 600px) {
  .cf-sidebar-menu { display: inline-block !important; }
  .cf-sidebar-title-text { display: none !important; }
}

/* --- Responsive/Pro Mobile Styles --- */
@media (max-width: 600px) {
  .cf-root,
  .cf-main,
  .cf-editor,
  .cf-editor-card {
    width: 100vw !important;
    min-width: 0 !important;
    max-width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
    background: inherit !important;
  }
  .cf-header {
    font-size: 1em !important;
    height: 44px !important;
    min-height: 44px !important;
    padding: 0 9px !important;
    border-radius: 0 !important;
  }
  .cf-logo {
    font-size: 1.05em !important;
    padding: 0 !important;
    letter-spacing: 0.5px !important;
  }
  .cf-header-actions {
    gap: 8px !important;
  }
  .cf-btn {
    padding: 6px 11px !important;
    font-size: 1em !important;
    border-radius: 6px !important;
  }
  .cf-main {
    flex-direction: column !important;
    min-height: 0 !important;
    min-width: 0 !important;
  }
  .cf-sidebar {
    width: 100vw !important;
    min-width: unset !important;
    border-right: none !important;
    border-bottom: 2px solid var(--cf-border) !important;
    flex-direction: row !important;
    overflow-x: auto !important;
    padding-top: 0 !important;
    box-shadow: none !important;
    max-height: 48px !important;
    align-items: center !important;
    background: var(--cf-sidebar) !important;
    position: relative !important;
    z-index: 10;
  }
  .cf-sidebar-title {
    font-size: 1em !important;
    margin: 10px 0 10px 10px !important;
    display: flex;
    align-items: center;
  }
  .cf-sidebar-item {
    font-size: 0.98em !important;
    padding: 8px 8px !important;
    border-radius: 0 13px 13px 0 !important;
    margin-bottom: 0 !important;
  }
  .cf-editor {
    min-width: 0 !important;
    min-height: 0 !important;
    width: 100vw !important;
    align-items: stretch !important;
    justify-content: flex-start !important;
    padding: 0 !important;
    background: var(--cf-bg) !important;
  }
  .cf-editor-card {
    margin: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    width: 100vw !important;
    max-width: 100vw !important;
    min-width: 0 !important;
    padding-bottom: 0 !important;
    background: var(--cf-card) !important;
    border: none !important;
  }
  .cf-editor-topbar, .cf-editor-statusbar {
    padding: 7px 6px !important;
    flex-direction: column !important;
    gap: 5px !important;
    align-items: stretch !important;
    font-size: 0.98em !important;
  }
  .cf-filename {
    word-break: break-all !important;
    font-size: 1em !important;
    padding: 0 !important;
  }
  .cf-lang-badge {
    font-size: 0.85em !important;
    margin-left: 7px !important;
    padding: 2px 6px !important;
  }
  .cf-actionbar {
    flex-wrap: wrap !important;
    gap: 3px !important;
    justify-content: flex-end !important;
  }
  .cf-action-btn {
    min-width: 36px !important;
    padding: 6px 0 !important;
    font-size: 1em !important;
    flex: 1 1 32% !important;
    border-radius: 4px !important;
  }
  .cf-monaco-wrap,
  .monaco-editor,
  .monaco-editor .overflow-guard,
  .monaco-editor-background,
  .monaco-editor .lines-content,
  .monaco-editor .margin,
  .monaco-editor .view-lines {
    width: 100vw !important;
    min-width: 0 !important;
    max-width: 100vw !important;
    overflow-x: auto !important;
    box-sizing: border-box !important;
  }
  .monaco-editor .margin-view-overlays,
  .monaco-editor .line-numbers {
    width: 32px !important;
    min-width: 32px !important;
    max-width: 32px !important;
    font-size: 0.92em !important;
  }
  .cf-monaco-wrap {
    margin: 0 !important;
    width: 100vw !important;
    min-width: 0 !important;
    max-width: 100vw !important;
    height: calc(100vh - 178px) !important;
    max-height: 66vh !important;
    overflow: hidden !important;
    border-radius: 0 !important;
    background: var(--cf-card) !important;
  }
  .monaco-editor, .monaco-editor-background {
    min-height: 36vh !important;
    max-height: 66vh !important;
    width: 100vw !important;
  }
  .cf-save-btn {
    width: 100% !important;
    min-width: 0 !important;
    font-size: 1em !important;
    padding: 12px 0 !important;
    position: static !important;
    margin-bottom: 8px !important;
    border-radius: 8px !important;
  }
  .cf-editor-card { padding-bottom: 0 !important; margin-bottom: 0 !important; }
}
/* End responsive/mobile styles */
      `}</style>
    </div>
  );
}

/* 
  --- NOTES ---
  - Hamburger menu appears as 3 lines on mobile, replaces the "Browse" text.
  - Sidebar collapses for mobile if you toggle the hamburger (expand/collapse logic can be made more advanced).
  - Monaco editor, header, and save bar all fit and never overlap or leave excess space.
  - .gitkeep files are hidden from the sidebar.
  - All styles are at the bottom for mobile, and comments explain each new section.
  - Tune the `calc(100vh - 178px)` in `.cf-monaco-wrap` if your header/sidebar heights change.
*/
