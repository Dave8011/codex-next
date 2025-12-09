import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({ path, onNavigate }) {
    if (!path) return null;

    const parts = path.split("/").filter(Boolean);

    return (
        <div className="cf-breadcrumbs">
            <span className="cf-breadcrumb-item" onClick={() => onNavigate("")}>
                <Home size={14} />
            </span>
            {parts.map((part, index) => {
                const fullPath = parts.slice(0, index + 1).join("/");
                return (
                    <div key={fullPath} className="cf-breadcrumb-group">
                        <ChevronRight size={14} className="cf-breadcrumb-sep" />
                        <span
                            className="cf-breadcrumb-item"
                            onClick={() => onNavigate(fullPath)}
                        >
                            {part}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
