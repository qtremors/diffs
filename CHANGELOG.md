# Diffs Changelog

> **Project:** Diffs
> **Version:** 0.2.0
> **Last Updated:** 2026-02-26

---

## [0.2.0] - 2026-02-26

### Added
- **TypeScript migration** — entire codebase migrated from JavaScript to TypeScript with strict mode.
- **Modular architecture** — plugin-style comparison engine (`lib/comparison/engine.ts`) with separate modules for text and image diffing.
- **Image comparison** — side-by-side, overlay (slider), pixel-level diff, and metadata comparison views.
- **Pixel diffing** — powered by `pixelmatch` for precise pixel-level difference detection with stats (changed %, count).
- **Multi-file comparison** — upload multiple files, select any as the original, compare all others against it.
- **IndexedDB persistence** — uploaded files and original selection auto-saved to IndexedDB, restored on page reload.
- **Manual storage clear** — Reset button clears both application state and IndexedDB.
- **Monochrome design** — 12-step grayscale palette with accent colors only for diff indicators (red/green) and status badges (blue/amber/green).
- **Fit-to-viewport images** — all image views constrain to available viewport space with `object-fit: contain`.
- **Scroll-to-zoom** — scroll wheel zoom (1x–8x) on image views with drag-to-pan when zoomed, zoom indicator badge with reset.
- **Collapsible input section** — collapse file cards into a summary bar to maximize comparison space.
- **File type badges** — colored indicators for TEXT (blue), IMAGE (amber), Original (green).
- **Filename headers** — diff panels show actual filenames instead of generic "Original" / "Modified".
- **Responsive layout** — `100dvh` shell with flexbox, adapts to all screen sizes.
- **Custom hooks** — `useComparison`, `useFileUpload`, `useScrollSync`, `useImageZoom`.
- **Drag-and-drop** — file drop zone with visual feedback.

### Changed
- **Project renamed** from "Side-by-Side Diff Viewer" to "Diffs".
- **Directory structure** — application moved from `web/` to `diffs/`.
- **Favicon** — set to `diffs.png` via Next.js metadata API (deleted conflicting `favicon.ico`).
- **Toolbar layout** — merged header into a single toolbar row (logo left, tabs + actions right).
- **Footer** — hidden when comparison results are showing to save viewport space.

### Fixed
- **Image overlay alignment** — switched from `overflow: hidden` to `clip-path: inset()` for proper alignment.
- **Image overflow** — images no longer crop/zoom unexpectedly; fit within viewport using `max-width`/`max-height` constraints.
- **Original badge clipping** — added `overflow: visible` to file cards so badge renders above the card border.
- **PowerShell execution policy** — bypassed via `cmd /c` wrapper for `npm install`.

### Removed
- Old JavaScript source files (`.js`) and `jsconfig.json`.
- Default `favicon.ico`.
- `web/` directory structure.

---

## [0.1.0] - 2026-02-19

### Added
- Initial project structure with Next.js 16.
- Side-by-side diff viewer implementation with GitHub Desktop aesthetic.
- Character-level diffing for precise intra-line highlighting.
- Scroll-synchronized comparison panels.
- File upload support for `.txt` and other text files.
- Glassmorphism design system for input panels.

### Fixed
- Resolved `scandir` errors by centralizing application in `web/` directory.
- Fixed root layout tag errors in Next.js structure.
- Corrected `.gitignore` patterns for multi-level directory support.

---