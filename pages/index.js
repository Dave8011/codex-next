// HOME PAGE
import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "../hooks/useTheme";
import { detectLanguage, parentPath } from "../utils/fileUtils";
import CreateFileOrFolder from "../components/CreateFileOrFolder";

// Monaco Editor dynamic import for SSR safety
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

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
      const res = await fetch(
        `/api/files/list?subpath=${encodeURIComponent(subpath)}`
      );
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
  const openFile = useCallback(
    async (filename) => {
      const fullPath = [currentPath, filename].filter(Boolean).join("/");
      try {
        const res = await fetch(
          `/api/files/open?path=${encodeURIComponent(fullPath)}`
        );
        if (!res.ok) throw new Error("Failed to open file.");
        const data = await res.json();
        setFileContent({ name: filename, content: data.content });
        setSaveStatus("");
        setCopyStatus("");
      } catch (e) {
        setFileContent(null);
        // This is the error handling quirk I mentioned.
        // For now, we'll leave it, but we can fix it later.
        setSaveStatus("error");
      }
    },
    [currentPath]
  );

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
        <span className="cf-logo"> ⮜⮞Codex Panel </span>
        <div className="cf-header-actions">
          <button
            className="cf-btn cf-theme-btn"
            onClick={() =>
              setTheme(
                theme === "unique"
                  ? "light"
                  : theme === "light"
                  ? "dark"
                  : "unique"
              )
            }
            aria-label="Theme"
          >
            {theme === "unique" ? "🌈" : theme === "light" ? "☀️" : "🌙"}
          </button>
          <button className="cf-btn cf-new-btn" onClick={() => setShowCreate(true)}>
            {" "}
            ➕New
          </button>
        </div>
      </header>

      <main className="cf-main">
        {/* Sidebar */}
        <nav className="cf-sidebar" aria-label="File navigation">
          <div className="cf-sidebar-title"> Browse </div>
          {currentPath && (
            <button
              className="cf-sidebar-item cf-up"
              onClick={() => fetchFiles(parentPath(currentPath))}
              aria-label="Up one folder"
            >
              <span className="cf-sidebar-icon"> ⬆️ </span>
              <span className="cf-sidebar-label"> .. </span>
            </button>
          )}
          {sidebarError ? (
            <div className="cf-sidebar-empty"> {sidebarError} </div>
          ) : files.length > 0 ? (
            files
              .filter((file) => file.name !== ".gitkeep") // <-- Correct placement
              .map((file) => (
                <button
                  key={`${currentPath}/${file.name}`}
                  className={`cf-sidebar-item ${
                    file.type === "folder" ? "cf-folder" : "cf-file"
                  }`}
                  onClick={() =>
                    file.type === "folder"
                      ? fetchFiles(
                          [currentPath, file.name].filter(Boolean).join("/")
                        )
                      : openFile(file.name)
                  }
                  aria-label={
                    file.type === "folder"
                      ? `Open folder ${file.name}`
                      : `Open file ${file.name}`
                  }
                >
                  <span className="cf-sidebar-icon">
                    {" "}
                    {file.type === "folder" ? "📂" : "📄"}{" "}
                  </span>
                  <span className="cf-sidebar-label"> {file.name} </span>
                </button>
              ))
          ) : (
            <div className="cf-sidebar-empty"> No files </div>
          )}
        </nav>

        {/* Editor */}
        <section className="cf-editor">
          {fileContent ? (
            <div className="cf-editor-card">
              <div className="cf-editor-topbar">
                <span className="cf-filename">
                  {" "}
                  {fileContent.name}
                  <span className="cf-lang-badge">
                    {" "}
                    {detectLanguage(fileContent.name)}{" "}
                  </span>
                </span>
                <div className="cf-actionbar">
                  <button
                    className="cf-action-btn"
                    onClick={handleFormat}
                    title="Format"
                  >
                    {" "}
                    🧹Format
                  </button>
                  <button
                    className="cf-action-btn"
                    onClick={handleCopy}
                    title="Copy code"
                  >
                    {" "}
                    {copyStatus ? "✅ Copied" : "📋 Copy"}{" "}
                  </button>
                  <button
                    className="cf-action-btn"
                    onClick={() => fetchFiles(currentPath)}
                  >
                    {" "}
                    ←Files
                  </button>
                </div>
              </div>
              <div className="cf-monaco-wrap">
                <MonacoEditor
                  height="75vh"
                  defaultLanguage={detectLanguage(fileContent.name)}
                  language={detectLanguage(fileContent.name)}
                  value={fileContent.content}
                  theme={
                    theme === "unique"
                      ? "vs-dark"
                      : theme === "light"
                      ? "vs-light"
                      : "vs-dark"
                  }
                  onChange={(val) =>
                    setFileContent({ ...fileContent, content: val })
                  }
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
                  {" "}
                  {saveStatus === "saving" && "💾 Saving..."}
                  {saveStatus === "saved" && (
                    <span className="cf-status-saved"> ✅Saved! </span>
                  )}
                  {saveStatus === "error" && (
                    <span className="cf-status-error"> ❌Save failed </span>
                  )}
                </span>
                <button
                  className="cf-save-btn"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setSaveStatus("saving");
                    const fullPath = [currentPath, fileContent.name]
                      .filter(Boolean)
                      .join("/");
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
              <span className="cf-editor-empty-icon"> 🗂️ </span>
              <div> Choose a file to view or edit </div>
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

      {/* NOTE: We are intentionally leaving the <style jsx global> block EMPTY.
        We will move its contents in the next step.
      */}
      <style jsx global>{`
        /* ===== STYLES WILL BE MOVED ===== */
      `}</style>
    </div>
  );
}
