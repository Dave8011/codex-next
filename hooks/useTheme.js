import { useState, useEffect } from "react";

// Theme management
export function useTheme() {
    const [theme, setTheme] = useState(() =>
        typeof window !== "undefined" ? localStorage.getItem("theme") || "unique" : "unique"
    );
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("theme", theme);
    }, [theme]);
    return [theme, setTheme];
}
