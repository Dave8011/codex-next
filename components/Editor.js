import dynamic from "next/dynamic";
import { detectLanguage } from "../utils/utils";

// Monaco Editor dynamic import for SSR safety
const MonacoEditor = dynamic(() =>
    import("@monaco-editor/react"), { ssr: false });

export default function Editor({
    fileContent,
    setFileContent,
    handleFormat,
    handleCopy,
    copyStatus,
    fetchFiles,
    currentPath,
    theme,
    saveStatus,
    saving,
    setSaving,
    setSaveStatus,
    monacoRef,
    editorRef
}) {
    return (
        <section className="cf-editor">
            {fileContent ? (
                <div className="cf-editor-card">
                    <div className="cf-editor-topbar">
                        <span className="cf-filename"> {fileContent.name}
                            <span className="cf-lang-badge"> {detectLanguage(fileContent.name)} </span>
                        </span>
                        <div className="cf-actionbar">
                            <button className="cf-action-btn"
                                onClick={handleFormat}
                                title="Format"> 🧹Format
                            </button>
                            <button className="cf-action-btn"
                                onClick={handleCopy}
                                title="Copy code"> {copyStatus ? "✅ Copied" : "📋 Copy"}
                            </button>
                            <button className="cf-action-btn"
                                onClick={() => fetchFiles(currentPath)}> ←Files
                            </button>
                        </div>
                    </div>
                    <div className="cf-monaco-wrap">
                        <MonacoEditor height="75vh"
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
                        <span className="cf-status-label"> {saveStatus === "saving" && "💾 Saving..."} {
                            saveStatus === "saved" && <span className="cf-status-saved"> ✅Saved! </span>} {
                                saveStatus === "error" && <span className="cf-status-error"> ❌Save failed </span>}
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
                                    }
                                    else {
                                        const data = await res.json().catch(() => ({}));
                                        setSaveStatus("error");
                                    }
                                }
                                catch { setSaveStatus("error"); }
                                setSaving(false);
                            }}>
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
    );
}
