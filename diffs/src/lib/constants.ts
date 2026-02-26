// ---------------------------------------------------------------------------
// Application-wide constants
// ---------------------------------------------------------------------------

export const APP_NAME = "Diffs";
export const APP_DESCRIPTION =
  "Compare text and images side-by-side with character-level highlighting and pixel-level diffing.";

/** MIME types recognised as text */
export const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/html",
  "text/css",
  "text/csv",
  "text/javascript",
  "text/markdown",
  "text/xml",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/x-yaml",
  "application/x-sh",
]);

/** MIME types recognised as images */
export const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "image/tiff",
  "image/avif",
]);

/** File extensions treated as text when MIME detection fails */
export const TEXT_EXTENSIONS = new Set([
  "txt", "md", "json", "js", "ts", "tsx", "jsx", "css", "scss",
  "html", "htm", "xml", "yaml", "yml", "toml", "ini", "cfg",
  "sh", "bash", "zsh", "fish", "py", "rb", "go", "rs", "java",
  "c", "cpp", "h", "hpp", "cs", "swift", "kt", "lua", "sql",
  "csv", "tsv", "log", "env", "gitignore", "dockerfile",
]);

/** File extensions treated as images when MIME detection fails */
export const IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "tiff", "tif", "avif",
]);

/** Pixel diff sensitivity threshold (0 = exact, higher = more tolerance) */
export const PIXEL_DIFF_THRESHOLD = 0.1;

/** Maximum file size for comparison (10 MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
