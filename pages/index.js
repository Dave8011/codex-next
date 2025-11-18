// HOME PAGE
import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

// Import our refactored modules
import { useTheme } from "../hooks/useTheme";
import { detectLanguage, parentPath } from "../utils/fileUtils";
import CreateFileOrFolder from "../components/CreateFileOrFolder";

// Monaco Editor dynamic import for SSR safety
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function Index() {
  // --- State Hooks ---
  const [theme, setTheme] = useTheme();
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [fileContent, setFileContent] = useState(null); // { name, content }
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // e.g., 'saving', 'saved', 'error'
  const [showCreate, setShowCreate] = useState(false); // Toggle for create modal
  const [copyStatus, setCopyStatus] = useState(""); // Feedback for copy button
  const [sidebarError, setSidebarError] = useState("");
  const [editorError, setEditorError] = useState(null); // <-- ADD THIS

  // --- NEW: State for mobile sidebar toggle ---
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // --- Ref Hooks ---
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  // --- NEW: Ref to store the auto-save timer ID ---
  const autoSaveTimerRef = useRef(null);

  // --- Core Functions ---

  /**
   * Fetches files and folders for the sidebar based on the subpath.
   */
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
      setFileContent(null); // Clear editor when changing folders
      setShowMobileSidebar(false); // --- NEW: Close sidebar on nav ---
    } catch (e) {
      setFiles([]);
      setSidebarError("Unable to load files.");
    }
  }, []); // Empty dependency array, this function is stable

  /**
   * Opens a file and loads its content into the editor.
   */
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
        setSaveStatus(""); // Clear save status on new file
        setCopyStatus("");
        setShowMobileSidebar(false); // --- NEW: Close sidebar on file open ---
      } catch (e) {
        setFileContent(null);
        setSaveStatus("error"); // Show open error
      }
    },
    [currentPath] // Re-create if currentPath changes
  );

  // --- Effect Hooks ---

  // Initial file fetch on component mount
  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFiles]); // fetchFiles is stable, so this runs once

  // --- NEW: Auto-save effect ---
  // This effect runs every time the file content changes
  useEffect(() => {
    // 1. Don't save if there's no file open or content is null
    if (!fileContent || fileContent.content === null) {
      return;
    }

    // 2. Clear any existing timer. This "debounces" the save.
    //    We only save *after* the user stops typing.
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 3. Set a new timer to save after 2 seconds (2000ms)
    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving"); // Show "Saving..."
      setSaving(true); // Disable save button
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
          setSaveStatus("saved"); // Show "Saved!"
          setTimeout(() => setSaveStatus(""), 1800); // Clear status after 1.8s
        } else {
          setSaveStatus("error"); // Show "Save failed"
        }
      } catch {
        setSaveStatus("error");
      }
      setSaving(false); // Re-enable save button
    }, 2000); // 2-second delay

    // 4. Cleanup: If the component unmounts, clear the timer
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };

    // This effect depends on the file's content and its path
  }, [fileContent, currentPath]);

  // --- Editor Action Functions ---

  /**
   * Formats the code in the Monaco editor.
   */
  function handleFormat() {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
    }
  }

  /**
   * Copies the current file's content to the clipboard.
   */
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

  /**
   * --- NEW: Manual Save Function ---
   * This is triggered by the "Save" button.
   * It cancels any pending auto-save and saves immediately.
   */
  const handleSave = async () => {
    if (!fileContent) return;

    // Clear any pending auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

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
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
    setSaving(false);
  };

  // --- Render JSX ---
  return (
    <div className="cf-root">
      {/* Header */}
      <header className="cf-header">
        <span className="cf-logo"> ⮜⮞Codex Panel </span>
        <div className="cf-header-actions">
          {/* --- NEW: Mobile Hamburger Menu Button --- */}
          <button
            className="cf-btn cf-sidebar-toggle"
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            aria-label="Toggle file navigation"
          >
            {showMobileSidebar ? "✕" : "☰"}
          </button>
          {/* --- End Hamburger --- */}

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
          <button
            className="cf-btn cf-new-btn"
            onClick={() => setShowCreate(true)}
          >
            {" "}
            ➕New
          </button>
        </div>
      </header>

      <main className="cf-main">
        {/* Sidebar */}
        {/* --- NEW: Added dynamic class for mobile show/hide --- */}
        <nav
          className={`cf-sidebar ${
            showMobileSidebar ? "cf-sidebar-open" : ""
          }`}
          aria-label="File navigation"
        >
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
              .filter((file) => file.name !== ".gitkeep")
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
                  // --- NEW: Height changed to 100% to fill container ---
                  height="100%"
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
                  // This onChange is what triggers the auto-save effect
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
                  // --- NEW: onClick now uses the handleSave function ---
                  onClick={handleSave}
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

      {/* Create File/Folder Modal */}
      <CreateFileOrFolder
        currentPath={currentPath}
        show={showCreate}
        onClose={() => setShowCreate(false)}
        // Re-fetch files after creating a new one
        onCreated={() => fetchFiles(currentPath)}
      />

      {/* The <style jsx global> block was removed and moved to styles/globals.css */}
    </div>
  );
}
