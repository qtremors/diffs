"use client";
import { useMemo, useState } from "react";
import { computeTextComparison } from "@/lib/comparison/text";

export default function Home() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const result = useMemo(() => {
    try { return { result: computeTextComparison(oldText, newText) }; }
    catch (cause) { return { error: cause instanceof Error ? cause.message : "Could not compare." }; }
  }, [oldText, newText]);
  return <main className="app-shell">
    <h1>Diffs</h1><p>Compare text locally in your browser.</p>
    <div className="diff-column-headings">
      <label>Original<textarea aria-label="Original" value={oldText} onChange={e => setOldText(e.target.value)} /></label>
      <label>Modified<textarea aria-label="Modified" value={newText} onChange={e => setNewText(e.target.value)} /></label>
    </div>
    {result.error ? <p role="alert">{result.error}</p> : <div aria-label="Text changes">
      {result.result?.lines.map((line, index) => <pre key={index}>
        {line.type !== "added" && <div style={{color: line.type === "unchanged" ? "inherit" : "#ffb5bd"}}>{line.type === "unchanged" ? " " : "-"}{line.left?.text}</div>}
        {line.type !== "unchanged" && line.type !== "removed" && <div style={{color:"#95f0b8"}}>+{line.right?.text}</div>}
      </pre>)}
    </div>}
  </main>;
}
