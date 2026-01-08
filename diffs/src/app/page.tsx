"use client";
import { useState } from "react";
import TextDiffViewer from "@/components/comparison/text/TextDiffViewer";
export default function Home() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [format, setFormat] = useState<"text" | "json" | "table">("text");
  return <main className="app-shell">
    <h1>Diffs</h1><p>Compare locally in your browser.</p>
    <div className="diff-column-headings">
      <label>Original<textarea aria-label="Original" value={oldText} onChange={e=>setOldText(e.target.value)} /></label>
      <label>Modified<textarea aria-label="Modified" value={newText} onChange={e=>setNewText(e.target.value)} /></label>
    </div>
<TextDiffViewer oldText={oldText} newText={newText} />
</main>;
}
