import { useState, useEffect } from "react";
import { FILE_EXTENSIONS, detectLanguage } from "../utils/utils";

export default function CreateFileOrFolder({ currentPath, onCreated, show, onClose }) {
    const [name, setName] = useState("");
    const [type, setType] = useState("file");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    // [EXTPATCH] extension state, default to 'js'
    const [extension, setExtension] = useState("js");
    useEffect(() => {
        if (show) {
            setName("");
            setType("file");
            setContent("");
            setError("");
            setExtension("js"); // [EXTPATCH] reset extension
        }
    }, [show]);
    // [EXTPATCH] handle name change and auto-select extension
    const handleNameChange = (e) => {
        const val = e.target.value;
        setName(val);
        // If user types .ext, match dropdown
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
                // [EXTPATCH] If user didn't type extension, add it
                if (!finalName.endsWith(`.${extension}`)) {
                    // If they typed a different extension, replace it
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
            }
            else { setError(data.error || "Failed to create."); }
        } catch (err) { setError("Network error."); }
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
                <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="cf-modal-select"
                >
                    <option value="file">File</option>
                    <option value="folder">Folder</option>
                </select>
                {/* [EXT PATCH] Name+extension input row for files */}
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
                                    <option key={ext} value={ext}>
                                        .{ext}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* [EXT PATCH] Show detected type */}
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
                <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="cf-modal-create"
                >
                    {loading ? <span className="cf-spinner"></span> : "➕ Create"}
                </button>
            </div>
        </div>
    );
}
