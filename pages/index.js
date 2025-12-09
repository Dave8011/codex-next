import { useState, useRef, useCallback, useEffect } from "react";
import { parentPath } from "../utils/utils";
import { useTheme } from "../hooks/useTheme";
import CreateFileOrFolder from "../components/CreateFileOrFolder";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Editor from "../components/Editor";
import CommandPalette from "../components/CommandPalette";
import Tabs from "../components/Tabs";
import Breadcrumbs from "../components/Breadcrumbs";

export default function Index() {
  const [theme, setTheme] = useTheme();
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [fileContent, setFileContent] = useState(null); // { name, content }
  const [openFiles, setOpenFiles] = useState([]); // Array of file objects
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
      // Don't clear fileContent here to keep tabs open
    } catch (e) {
      setFiles([]);
      setSidebarError("Unable to load files.");
    }
  }, []);

  // Open file for editing
  const openFile = useCallback(async (filename) => {
    // Check if already open
    const existing = openFiles.find(f => f.name === filename);
    if (existing) {
      setFileContent(existing);
      return;
    }

    const fullPath = [currentPath, filename].filter(Boolean).join("/");
    try {
      const res = await fetch(`/api/files/open?path=${encodeURIComponent(fullPath)}`);
      if (!res.ok) throw new Error("Failed to open file.");
      const data = await res.json();
      const newFile = { name: filename, content: data.content, path: fullPath };

      setFileContent(newFile);
      setOpenFiles(prev => [...prev, newFile]);
      setSaveStatus("");
      setCopyStatus("");
    } catch (e) {
      // setFileContent(null); // Don't clear if error, maybe just show error toast
      setSaveStatus("error");
    }
  }, [currentPath, openFiles]);

  const closeFile = (filename) => {
    const newOpenFiles = openFiles.filter(f => f.name !== filename);
    setOpenFiles(newOpenFiles);
    if (fileContent?.name === filename) {
      setFileContent(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };

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
      <CommandPalette
        files={files.filter(f => f.type !== 'folder')}
        openFile={openFile}
        theme={theme}
        setTheme={setTheme}
        handleFormat={handleFormat}
      />

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

        {/* Editor Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Tabs
            openFiles={openFiles}
            activeFile={fileContent}
            setActiveFile={setFileContent}
            closeFile={closeFile}
          />

          {/* Breadcrumbs (passed as children or rendered above editor) */}
          {/* Note: Editor component has its own card structure. 
                 We might want to render breadcrumbs inside the editor topbar if we modify Editor.js, 
                 OR just above it. 
                 Given the design, let's put it inside the Editor component via a prop if possible, 
                 or just above the editor card in the main layout. 
                 But Editor.js renders the card. 
                 Let's pass it as a prop or modify Editor.js to accept children? 
                 Actually, let's just render it here and maybe adjust CSS if needed.
                 Wait, Editor.js has a specific layout. 
                 Let's modify Editor.js to accept a `breadcrumbs` prop.
                 I'll update Editor.js in a separate step if needed, but for now let's pass it as a prop if I can.
                 Wait, I haven't updated Editor.js to accept breadcrumbs.
                 I'll render it above the Editor for now.
             */}

          <Editor
            fileContent={fileContent}
            setFileContent={(newContent) => {
              setFileContent(newContent);
              setOpenFiles(prev => prev.map(f => f.name === newContent.name ? newContent : f));
            }}
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
            breadcrumbs={
              <Breadcrumbs
                path={currentPath}
                onNavigate={(path) => fetchFiles(path)}
              />
            }
          />
          {/* I'll inject breadcrumbs into the editor top bar via a portal or just modify Editor.js later. 
                 For now, let's render it above the editor if a file is open. 
             */}
        </div>
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
