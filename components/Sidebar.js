import { motion, AnimatePresence } from "framer-motion";
import { parentPath } from "../utils/utils";

export default function Sidebar({ files, currentPath, fetchFiles, openFile, sidebarError, isMenuOpen, setIsMenuOpen }) {
    return (
        <nav className={`cf-sidebar ${isMenuOpen ? 'open' : ''}`} aria-label="File navigation">
            <div className="cf-sidebar-title">Browse</div>
            {currentPath && (
                <button className="cf-sidebar-item cf-up"
                    onClick={() => fetchFiles(parentPath(currentPath))}
                    aria-label="Up one folder">
                    <span className="cf-sidebar-icon">⬆️</span>
                    <span className="cf-sidebar-label">..</span>
                </button>
            )}
            {sidebarError ? (
                <div className="cf-sidebar-empty">{sidebarError}</div>
            ) : files.length > 0 ? (
                <AnimatePresence>
                    {files
                        .filter(file => file.name !== '.gitkeep')
                        .map((file, index) => (
                            <motion.button
                                key={`${currentPath}/${file.name}`}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05, duration: 0.2 }}
                                className={`cf-sidebar-item ${file.type === "folder" ? "cf-folder" : "cf-file"}`}
                                onClick={() => {
                                    if (file.type === "folder") {
                                        fetchFiles([currentPath, file.name].filter(Boolean).join("/"));
                                    } else {
                                        openFile(file.name);
                                        setIsMenuOpen(false); // Close menu on file selection
                                    }
                                }}
                                aria-label={file.type === "folder" ? `Open folder ${file.name}` : `Open file ${file.name}`}>
                                <span className="cf-sidebar-icon">{file.type === "folder" ? "📂" : "📄"}</span>
                                <span className="cf-sidebar-label">{file.name}</span>
                            </motion.button>
                        ))}
                </AnimatePresence>
            ) : (
                <div className="cf-sidebar-empty">No files</div>
            )}
        </nav>
    );
}
