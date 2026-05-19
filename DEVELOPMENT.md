# Diffs - Developer Documentation

> Architecture, setup, and verification guidance for Diffs development.

**Version:** 0.0.9 | **Last Updated:** 2026-05-19
**Scope:** Local browser comparisons and TypeScript tooling.

---

## Architecture Overview

The page composes the workspace. Comparison algorithms live in `src/lib/comparison/`, browser helpers in `src/lib/utils/`, and presentation in `src/components/`. Keep algorithms independent of React and browser storage. Preserve raw source text and bytes when deriving display representations.

## Technology Stack

Next.js, React, strict TypeScript, and Node.js 24+. Application code, tests, scripts, and executable configuration use TypeScript. Dependencies and JSON configuration live in `package.json`.

## Configuration

```sh
cd diffs
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Local Validation

```sh
npm run check
npm run build
```

Run TypeScript tests with Node's native type stripping and a registration hook for source aliases. Keep input limits and source preservation covered. Verify affected interactions manually in a browser.

## Maintenance Notes

Keep changes within the owning comparator, hook, or viewer. Review the complete diff and document completed user-visible behavior in the changelog. Application versions and lockfile root versions must match.

---

[Back to README](README.md)
