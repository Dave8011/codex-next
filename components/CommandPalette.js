import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { Search, File, Moon, Sun, Paintbrush, AlignLeft } from "lucide-react";

export default function CommandPalette({ files, openFile, theme, setTheme, handleFormat }) {
    const [open, setOpen] = useState(false);

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="cf-cmdk-dialog"
        >
            <div className="cf-cmdk-wrapper">
                <div className="cf-cmdk-header">
                    <Search className="cf-cmdk-icon" size={18} />
                    <Command.Input placeholder="Type a command or search..." className="cf-cmdk-input" />
                </div>

                <Command.List className="cf-cmdk-list">
                    <Command.Empty className="cf-cmdk-empty">No results found.</Command.Empty>

                    <Command.Group heading="Files">
                        {files.map((file) => (
                            <Command.Item
                                key={file.name}
                                onSelect={() => {
                                    openFile(file.name);
                                    setOpen(false);
                                }}
                                className="cf-cmdk-item"
                            >
                                <File size={14} style={{ marginRight: 8 }} />
                                {file.name}
                            </Command.Item>
                        ))}
                    </Command.Group>

                    <Command.Group heading="Actions">
                        <Command.Item
                            onSelect={() => {
                                handleFormat();
                                setOpen(false);
                            }}
                            className="cf-cmdk-item"
                        >
                            <AlignLeft size={14} style={{ marginRight: 8 }} />
                            Format Document
                        </Command.Item>
                        <Command.Item
                            onSelect={() => {
                                setTheme(theme === "dark" ? "light" : "dark");
                                setOpen(false);
                            }}
                            className="cf-cmdk-item"
                        >
                            {theme === "dark" ? <Sun size={14} style={{ marginRight: 8 }} /> : <Moon size={14} style={{ marginRight: 8 }} />}
                            Toggle Theme
                        </Command.Item>
                        <Command.Item
                            onSelect={() => {
                                setTheme("unique");
                                setOpen(false);
                            }}
                            className="cf-cmdk-item"
                        >
                            <Paintbrush size={14} style={{ marginRight: 8 }} />
                            Set Unique Theme
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </div>
        </Command.Dialog>
    );
}
