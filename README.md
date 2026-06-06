<p align="center">
  <img src="assets/Diffs.svg" alt="Diffs Logo" width="120"/>
</p>

<h1 align="center"><a href="https://diffs.vercel.app/">Diffs</a></h1>

<p align="center">
  See what changed. A local workspace for files, documents, and data.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web-0969da" alt="Web application">
  <img src="https://img.shields.io/badge/License-TSL-red" alt="License">
</p>

> [!NOTE]
> **Privacy first:** Diffs compares your files in your browser. File contents and pasted text are not uploaded for comparison. Sessions are temporary unless you enable **Remember this tab**.

## Why Diffs

Diffs brings text, images, structured data, PDFs, and exact file comparison into one local workspace. Choose an original, compare other versions against it, and review changes with clear labels, red removals, and green additions. There are no accounts, ads, or analytics in the application.

## Open Diffs

Open [diffs.vercel.app](https://diffs.vercel.app/) in your browser. Choose files or folders, or paste text into the editable panes, to start comparing.

Use a current browser with Web Workers, Web Crypto, IndexedDB, OffscreenCanvas, and image bitmap support. For local setup and build commands, see the [developer guide](DEVELOPMENT.md#configuration).

## Features

- **Editable text comparison:** Paste or type directly into two diff panes with line and word highlights, undo and redo, whitespace options, and change navigation. Long lines wrap by default. Desktop panes sit side by side; phones stack Original above Modified with linked scrolling.
- **Text file review:** Compare aligned lines with character highlights, line endings, change counts, wrapping, and split or unified views. Copy modified text or export an exact unified patch, including whitespace changes hidden by review options.
- **Image comparison:** Use linked side-by-side views, a keyboard-accessible wipe, or a pixel difference mask. Inspect image details, adjust sensitivity, zoom and pan, fit the canvas, or export the difference as PNG.
- **Structured data:** Compare JSON fields with lossless numbers and JSON Pointer paths. Review CSV and TSV records with selectable separators, headings, and unique row keys. Search changes and export JSON reports.
- **PDF text:** Review selectable text by page, link or independently select pages, navigate changes, and export reports. Scanned documents need OCR; layout and images are outside this comparison.
- **Exact file checks:** Calculate SHA-256 from original bytes, verify an expected fingerprint, and inspect changed byte ranges in a paged hexadecimal view. Other formats, including archives, Office documents, audio, and video, can use this view without format-specific decoding.
- **Folder snapshots:** Review added, removed, changed, and matching relative paths using file sizes and SHA-256. Search results and export manifest comparisons. File contents are released after hashing.
- **Multiple sources:** Load up to 12 sources, choose any original, and compare candidates on demand in cancellable background workers.
- **Optional reload recovery:** Enable **Remember this tab** to save files and pasted text in this browser. Turn it off or use Reset to delete that tab's saved copy.

## Supported inputs and limits

| Input | Support |
| --- | --- |
| Text and code | Valid UTF-8 text, Markdown, and common source and configuration extensions. |
| JSON | Field matching, exact numeric precision, positional arrays; 100 nesting levels, 50,000 values, 20,000 field changes, and bounded result size. Duplicate keys are rejected. |
| CSV / TSV | Comma, tab, semicolon, or pipe; quoted multiline cells; optional headings and row key. Up to 5,000 data rows, 200 columns, and 100,000 cells. |
| PDF | Selectable text only, up to 100 pages and 500,000 extracted characters. Password-protected files and OCR are unsupported. |
| Other files | Exact bytes, SHA-256, and a 256-byte hex page. Office documents, archives, audio, and video are not decoded semantically. |
| Folders | Folder picker; up to 1,000 files per snapshot. Exact relative paths, sizes, and hashes. Empty folders and fuzzy rename detection are excluded. |
| Still images | PNG, JPEG, WebP, AVIF, BMP, and SVG, subject to browser decoding support. Animated images are unsupported. SVG is rasterized for comparison. |
| File limits | 10 MiB per file, 30 MiB total, and 12 sources. Each folder counts as one source; its files share the byte limits. |
| Text limits | 500,000 characters and 20,000 lines per side. Expensive changes fall back to line highlighting. |
| Image limits | 8 million pixels and at most 16,384 pixels per dimension. The common comparison canvas must also fit these limits. Rendered SVG payloads count toward the session budget. |

Use **Compare as** to switch structured data to source text or any two regular files to bytes. SHA-256 covers the original file, including metadata, encoding, and line endings. Matching JSON data, extracted PDF text, or rendered pixels can still have different file fingerprints.

Images retain their native dimensions and align at the top left of a shared transparent canvas. Smaller images are padded, never stretched. Pixel results depend on the selected sensitivity; matching pixels do not establish matching source bytes or metadata.

## Privacy

Comparison runs in your browser. Fonts and interface assets are served with the app; no CDN is needed for PDF support. A hosted instance still receives ordinary requests for the application and its assets.

Saved sessions are local to the site's origin and are not an encrypted backup. A new tab starts separately; duplicating a tab may inherit its session identity. Closing a tab can leave its saved record in browser storage while making it inaccessible through the app. Use Reset or disable retention before closing to remove that tab's saved copy, or clear site data in your browser.

Read the [privacy policy](PRIVACY.md) for file access, storage, and hosting details.

## Community and support

- Join the [Discord community](https://discord.gg/QgUjuNj9U8).
- Report bugs or request features through [GitHub Issues](https://github.com/qtremors/diffs/issues).
- Review changes in the [changelog](CHANGELOG.md).
- Read the [privacy policy](PRIVACY.md).

## Credits

Diffs is built by [Tremors](https://github.com/qtremors) with TypeScript and the web platform. Thanks to the maintainers of:

- [Next.js](https://nextjs.org/), [React](https://react.dev/), and [TypeScript](https://www.typescriptlang.org/)
- [CodeMirror](https://codemirror.net/), [jsdiff](https://github.com/kpdecker/jsdiff), [Pixelmatch](https://github.com/mapbox/pixelmatch), and [PDF.js](https://mozilla.github.io/pdf.js/)
- [Tailwind CSS](https://tailwindcss.com/) and [Lucide](https://lucide.dev/)

Each project remains the property of its respective authors and is used under its own license.

## For developers

Architecture, project structure, format semantics, setup, local checks, and maintenance guidance live in [DEVELOPMENT.md](DEVELOPMENT.md). Unfinished work belongs in [TASKS.md](TASKS.md).

## License

Diffs is source-available under the **Tremors Source License (TSL)**. Personal, non-commercial use and source forks are permitted under its terms; commercial and internal-business production use require written permission. Attribution and distribution restrictions apply.

Read [LICENSE.md](LICENSE.md) or the [web version](https://qtremors.github.io/license).

---

<p align="center">
  Made by <a href="https://github.com/qtremors">Tremors</a>
</p>
