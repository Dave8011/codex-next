export default function Header({ theme, setTheme, setShowCreate, isMenuOpen, setIsMenuOpen }) {
    return (
        <header className="cf-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* [EXTPATCH] Hamburger Button */}
                <button
                    className="cf-menu-btn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    ☰
                </button>
                <span className="cf-logo"> ⮜⮞Codex Panel </span>
            </div>
            <div className="cf-header-actions">
                <button className="cf-btn cf-theme-btn"
                    onClick={() => setTheme(theme === "unique" ? "light" : theme === "light" ? "dark" : "unique")}
                    aria-label="Theme">
                    {theme === "unique" ? "🌈" : theme === "light" ? "☀️" : "🌙"}
                </button>
                <button className="cf-btn cf-new-btn"
                    onClick={() => setShowCreate(true)}> ➕New
                </button>
            </div>
        </header>
    );
}
