// Language detection based on file extension
export function detectLanguage(filename = "") {
  const ext = filename.split(".").pop().toLowerCase();
  const map = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    css: "css",
    scss: "scss",
    html: "html",
    htm: "html",
    md: "markdown",
    markdown: "markdown",
    py: "python",
    java: "java",
    php: "php",
    rb: "ruby",
    c: "c",
    h: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    hpp: "cpp",
    go: "go",
    rs: "rust",
    sh: "shell",
    bash: "shell",
    xml: "xml",
    yml: "yaml",
    yaml: "yaml",
    sql: "sql",
    swift: "swift",
    txt: "txt",
  };
  return map[ext] || "plaintext";
}

// Supported file extensions for dropdown
export const FILE_EXTENSIONS = [
  "js", "jsx", "ts", "tsx", "json", "css", "scss", "html", "md", "py", "java",
  "php", "rb", "c", "cpp", "go", "rs", "sh", "xml", "yml", "yaml", "sql", "swift", "txt"
];

// Get parent folder from a path
export function parentPath(path) {
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}
