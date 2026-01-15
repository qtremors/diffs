export const APP_NAME = "Diffs";
export const APP_DESCRIPTION =
  "A quiet place to compare text and images. Private by default.";
export const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "mdx",
  "json",
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "css",
  "scss",
  "sass",
  "less",
  "html",
  "htm",
  "xml",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "sh",
  "bash",
  "zsh",
  "fish",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "c",
  "cpp",
  "h",
  "hpp",
  "cs",
  "swift",
  "kt",
  "lua",
  "sql",
  "csv",
  "tsv",
  "log",
  "env",
  "gitignore",
  "dockerfile",
  "makefile",
  "svelte",
  "vue",
  "graphql",
  "properties",
]);
export const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "bmp",
  "svg",
  "avif",
]);
export const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "image/avif",
]);
export const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/x-yaml",
  "application/x-sh",
  "application/toml",
]);
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 30 * 1024 * 1024;
export const MAX_FILES = 12;
export const MAX_TEXT_LENGTH = 500_000;
export const MAX_TEXT_LINES = 20_000;
export const MAX_IMAGE_PIXELS = 8_000_000;
export const MAX_IMAGE_DIMENSION = 16_384;
export const PIXEL_DIFF_THRESHOLD = 0.1;
export const MAX_FOLDER_FILES = 1000;
export const MAX_PDF_PAGES = 100;
export const MAX_TABLE_ROWS = 5000;
export const MAX_TABLE_COLUMNS = 200;
export const MAX_TABLE_CELLS = 100_000;
export const DEFAULT_TABLE_OPTIONS = {
  delimiter: "auto" as const,
  headers: true,
  keyColumn: null,
};
