import { useState, useRef, useCallback, useEffect } from "react";
import { parentPath } from "../utils/utils";
import { useTheme } from "../hooks/useTheme";
import CreateFileOrFolder from "../components/CreateFileOrFolder";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Editor from "../components/Editor";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
    <div className="cf-root">
      {/* Header */}
      <Header
        theme={theme}
        setTheme={setTheme}
        setShowCreate={setShowCreate}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      {/* Mobile Sidebar Backdrop */}
      {isMenuOpen && (
        <div
          className="cf-sidebar-backdrop"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <main className="cf-main">
        {/* Sidebar */}
        <Sidebar
          files={files}
          currentPath={currentPath}
          fetchFiles={fetchFiles}
          openFile={openFile}
          sidebarError={sidebarError}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />

        {/* Editor */}
        <Editor
          fileContent={fileContent}
          setFileContent={setFileContent}
          handleFormat={handleFormat}
          handleCopy={handleCopy}
          copyStatus={copyStatus}
          fetchFiles={fetchFiles}
          currentPath={currentPath}
          theme={theme}
          saveStatus={saveStatus}
          saving={saving}
          setSaving={setSaving}
          setSaveStatus={setSaveStatus}
          monacoRef={monacoRef}
          editorRef={editorRef}
        />
      </main>

      <CreateFileOrFolder
        currentPath={currentPath}
        show={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => fetchFiles(currentPath)}
      />
    </div>
  );
}
