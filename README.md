<p align="center">
  <img src="diffs/public/diffs.png" alt="Diffs Logo" width="120"/>
</p>

<h1 align="center"><a href="https://diffs.vercel.app">Diffs</a></h1>

<p align="center">
  Compare anything — text, images, and more.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-TSL-red" alt="License">
</p>

> [!NOTE]
> **Personal Project** 🎯 I built this to explore diffing algorithms, image comparison techniques, and create a premium web-based comparison tool.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Text Diffing** | Character-level highlighting with side-by-side synchronized panels. |
| 🖼️ **Image Comparison** | Side-by-side, overlay slider, pixel-level diff, and metadata views. |
| 📁 **Multi-File** | Upload multiple files, select any as original, compare all others. |
| � **Pixel Diff** | Precise pixel-level difference detection with change statistics. |
| 🔎 **Zoom & Pan** | Scroll-to-zoom (1x–8x) with drag-to-pan on all image views. |
| � **Persistence** | Auto-saves to IndexedDB, restores on reload, manual clear option. |
| 🎨 **Monochrome UI** | Grayscale chrome with color accents only for diff indicators. |
| 📱 **Responsive** | Adapts to all screen sizes, maximizes comparison space. |

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | `v18+` | [nodejs.org](https://nodejs.org/) |
| npm | `v9+` | (Included with Node.js) |

### Setup

```bash
# Clone and navigate
git clone https://github.com/qtremors/diffs.git
cd diffs/diffs

# Install dependencies
npm install

# Run the project
npm run dev
```

Visit **http://localhost:3000**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Language** | TypeScript (strict mode) |
| **Text Diffing** | `diff` (jsdiff) |
| **Image Diffing** | `pixelmatch` |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS with Tailwind CSS utilities |
| **Storage** | IndexedDB (browser-side persistence) |

---

## 📁 Project Structure

```
diffs/
├── diffs/                    # Next.js Application
│   ├── src/
│   │   ├── app/              # Pages, layouts, global styles
│   │   ├── components/       # UI and comparison components
│   │   │   ├── comparison/   # Text, image diff viewers
│   │   │   ├── layout/       # Header, Footer
│   │   │   └── ui/           # Tabs, Badge, shared UI
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Comparison engine, types, utils
│   └── public/               # Static assets (diffs.png)
├── DEVELOPMENT.md            # Developer documentation
├── CHANGELOG.md              # Version history
├── LICENSE.md                # License terms
├── TASKS.md                  # Planned features and known issues
└── README.md
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Architecture, conventions, and developer guides |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |
| [TASKS.md](TASKS.md) | Planned features and known issues |
| [LICENSE.md](LICENSE.md) | License terms and attribution |

---

## 📄 License

**Tremors Source License (TSL)** - Source-available license allowing viewing, forking, and derivative works with **mandatory attribution**. Commercial use requires written permission.

Web Version: [github.com/qtremors/license](https://github.com/qtremors/license)

See [LICENSE.md](LICENSE.md) for full terms.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/qtremors">Tremors</a>
</p>
