# Side-by-Side Diff Viewer Changelog

> **Project:** Side-by-Side Diff Viewer
> **Version:** 0.1.0
> **Last Updated:** 2026-02-19

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Feature for export/download of diff results.

---

## [0.1.0] - 2026-02-19

### Added
- Initial project structure with Next.js 16.
- Side-by-Side Diff Viewer implementation with GitHub Desktop aesthetic.
- Character-level diffing for precise intra-line highlighting.
- Scroll-synchronized comparison panels.
- File upload support for `.txt` and other text files.
- Glassmorphism design system for input panels.

### Fixed
- Resolved `scandir` errors by centralizing application in `web/` directory.
- Fixed root layout tag errors in Next.js structure.
- Corrected `.gitignore` patterns for multi-level directory support.

---

[0.1.0]: https://github.com/qtremors/diff/releases/tag/v0.1.0
