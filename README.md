<p align="center">
  <img src="diffs/public/diffs.png" alt="Side-by-Side Diff Viewer Logo" width="120"/>
</p>

<h1 align="center"><a href="https://github.com/qtremors/diff">Side-by-Side Diff Viewer</a></h1>

<p align="center">
  A high-performance, GitHub-style diff viewer for text and files with character-level highlighting.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/License-TSL-red" alt="License">
</p>

> [!NOTE]
> **Personal Project** 🎯 I built this to explore high-performance diffing algorithms and create a premium web-based side-by-side comparison tool.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Char-level Diff** | Precise intra-line highlighting for character-level changes. |
| ↔️ **Side-by-Side** | Classic GitHub-style aligned comparison panels. |
| 🔄 **Scroll Sync** | Perfectly synchronized scrolling between original and modified views. |
| 📁 **File Support** | Drag and drop or upload files directly for comparison. |
| 🎨 **Premium UI** | Clean, high-contrast dark theme inspired by GitHub Desktop. |

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
git clone https://github.com/qtremors/diff.git
cd diff/web

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
| **Frontend** | Next.js 16 (App Router), React 19 |
| **Logic** | `diff` (jsdiff) |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS with Tailwind CSS utilities |

---

## 📁 Project Structure

```
diff/
├── web/                  # Next.js Application
│   ├── src/
│   │   ├── app/          # Pages and global styles
│   │   └── components/   # Interactive React components
│   └── public/           # Static assets
├── DEVELOPMENT.md        # Developer documentation
├── CHANGELOG.md          # Version history
├── LICENSE.md            # License terms
├── TASKS.md              # Current development tasks
└── README.md
```

---

## 🧪 Testing

```bash
cd web
npm run build
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Architecture, conventions, and developer guides. |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes. |
| [TASKS.md](TASKS.md) | Planned features and known issues. |
| [LICENSE.md](LICENSE.md) | License terms and attribution. |

---

## 📄 License

**Tremors Source License (TSL)** - Source-available license allowing viewing, forking, and derivative works with **mandatory attribution**. Commercial use requires written permission.

See [LICENSE.md](LICENSE.md) for full terms.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/qtremors">Tremors</a>
</p>
