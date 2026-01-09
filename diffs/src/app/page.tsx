"use client";
import { useState } from "react";
import TextDiffViewer from "@/components/comparison/text/TextDiffViewer";
import { compareJson } from "@/lib/comparison/json";
import JsonViewer from "@/components/comparison/data/JsonViewer";
export default function Home() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [format, setFormat] = useState<"text" | "json" | "table">("text");
  let jsonResult;
  let error = "";
  if (format === "json") {
    try { jsonResult = compareJson(oldText, newText); }
    catch (cause) { error = cause instanceof Error ? cause.message : "Could not compare."; }
  }
  return <main className="app-shell">
    <h1>Diffs</h1><p>Compare locally in your browser.</p>
    <label>Compare as<select value={format} onChange={e=>setFormat(e.target.value as typeof format)}>
      <option value="text">Source text</option><option value="json">JSON fields</option></select></label>
    <div className="diff-column-headings">
      <label>Original<textarea aria-label="Original" value={oldText} onChange={e=>setOldText(e.target.value)} /></label>
      <label>Modified<textarea aria-label="Modified" value={newText} onChange={e=>setNewText(e.target.value)} /></label>
    </div>
{format === "json" ? error ? <p role="alert">{error}</p> : jsonResult && <JsonViewer result={jsonResult} /> : <TextDiffViewer oldText={oldText} newText={newText} />}
</main>;
}
