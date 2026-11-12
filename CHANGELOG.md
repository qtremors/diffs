# Diffs Changelog

> **Project:** Diffs
> **Version:** 0.1.2
> **Last Updated:** 2026-11-12

---

## [0.1.2] - 2026-11-12

- **Text Search:** Find literal text in either source with match-case control, next/previous matches, keyboard shortcuts, and bounded highlights that reveal folded and virtualized text.
- **Changed Blocks:** Copy original or modified text for the selected change while preserving whitespace, line endings, and missing final newlines.
- **Mobile Review:** Fit JSON changes to the screen, enlarge touch controls, adapt narrow headers and image tabs, and keep long filenames and storage messages within the viewport.
- **Workspace Navigation:** Move to the comparison after starting a review, keep cancellation beside the results, and explain sideways scrolling for wide tables.
- **Presentation:** Use clearer change counts, native search controls, and useful filters; allow page scrolling over fitted images on phones.
- **Loading:** Load editable text and comparison viewers when needed.
- **Build Reliability:** Disable persisted production transforms after repeated builds served stale styles.
- **Image Memory:** Reuse one rendering canvas, encode PNGs sequentially, and release decoded images and canvas storage after use.
- **Browser Checks:** Add production regression tests for comparison formats, exports, editing, cancellation, storage recovery, and desktop, tablet, and phone layouts, with Firefox and WebKit projects available.

## [0.1.1] - 2026-11-12

- **Reload Recovery:** Keep failed saved-copy deletion visible across reloads, support retries, and allow Reset after a saved session fails to restore.
- **Exact Files:** Keep files available as bytes when text, PDF, or image decoding is unavailable, with a visible explanation.
- **Image Validation:** Detect animated PNGs before still-image decoding and release pending image reads when cancelled.
- **Accessible Review:** Pan zoomed images with arrow keys and larger Shift steps, keep image edges reachable, and announce text line sources and changes.
- **Image Memory:** Evict older cached image results when retained image strings exceed the cache budget.
- **Maintenance:** Add storage, ingestion, image navigation, and cache regressions; isolate the fixed minimatch version used by TypeScript lint tooling.

## [0.1.0] - 2026-06-06

- **Documentation:** Add the application link, supported inputs and limits, privacy policy, credits, and support details.
- **Developer Guide:** Document module ownership, comparison semantics, setup, local checks, and troubleshooting.
- **Branding:** Use the included SVG assets for the project overview and browser icon.

## [0.0.9] - 2026-05-19

- **Responsive Review:** Adapt file, data, image, and editable text controls to narrow screens with readable boundaries and focus states.
- **Reliability:** Validate source preservation, malformed formats, limits, fingerprints, and saved records with local TypeScript regression tests.

## [0.0.8] - 2026-05-18

- **Editable Panes:** Type or paste into the same panes that display line and word changes, with undo, redo, and preserved selection.
- **Workspace Controls:** Switch between files and pasted data, swap sources, load examples, collapse inputs, and reset the workspace.

## [0.0.7] - 2026-05-11

- **Exact Files:** Verify SHA-256, inspect changed byte ranges, and compare folder snapshots by relative path and fingerprint.
- **PDF Text:** Review extracted text by page, select pages independently, and identify scanned documents that need OCR.
- **Reload Recovery:** Keep sessions temporary or opt into per-tab browser storage; reset or disable retention to remove saved copies.

## [0.0.6] - 2026-01-19

- **File Workspace:** Load several sources, choose an original, and compare candidates on demand.
- **Loading:** Preserve original bytes and fingerprints, enforce source budgets, and cancel pending file reads or comparison jobs.

## [0.0.5] - 2026-01-18

- **Images:** Compare still images side by side, with an adjustable wipe, or through a pixel difference mask.
- **Image Controls:** Inspect details, adjust sensitivity, share zoom and pan, fit the canvas, and export PNG differences.

## [0.0.4] - 2026-01-15

- **Table Records:** Compare CSV and TSV with separator selection, headings, and unique row keys.
- **Data Review:** Preserve quoted cells and leading zeroes, distinguish missing columns, and export structured reports.

## [0.0.3] - 2026-01-09

- **JSON Fields:** Review field changes with lossless numeric precision, JSON Pointer paths, search, and report export.
- **Validation:** Reject duplicate keys, malformed input, excessive nesting, and oversized results.

## [0.0.2] - 2026-01-08

- **Text Review:** Navigate changes, switch split and unified views, wrap lines, and review whitespace and line endings.
- **Actions:** Copy modified text and export exact unified patches; run cancellable comparisons in background workers.

## [0.0.1] - 2026-01-07

- **Text Comparison:** Compare pasted text locally with line changes, original and modified panes, and source-preserving differences.
- **Privacy:** Start temporary sessions without accounts or comparison uploads.
