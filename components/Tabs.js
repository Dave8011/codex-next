import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Tabs({ openFiles, activeFile, setActiveFile, closeFile }) {
    if (openFiles.length === 0) return null;

    return (
        <div className="cf-tabs-container">
            <AnimatePresence>
                {openFiles.map((file) => (
                    <motion.div
                        key={file.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className={`cf-tab ${activeFile?.name === file.name ? "active" : ""}`}
                        onClick={() => setActiveFile(file)}
                    >
                        <span className="cf-tab-name">{file.name}</span>
                        <button
                            className="cf-tab-close"
                            onClick={(e) => {
                                e.stopPropagation();
                                closeFile(file.name);
                            }}
                        >
                            <X size={12} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
