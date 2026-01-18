"use client";
import { useState } from "react";
import TextDiffViewer from "@/components/comparison/text/TextDiffViewer";
import PastedComparison from "@/components/comparison/data/PastedComparison";
import { computeImageDiff } from "@/lib/comparison/image";
import { inspectImage } from "@/lib/utils/image";
import { readFileAsDataUrl } from "@/lib/utils/file";
import ImageDiffViewer from "@/components/comparison/image/ImageDiffViewer";
import type { ComparisonFile, ImageDiffResult } from "@/lib/types";
export default function Home() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [format, setFormat] = useState<"text" | "json" | "table">("text");
  const [images, setImages] = useState<(ComparisonFile | null)[]>([null, null]);
  const [imageResult, setImageResult] = useState<ImageDiffResult | null>(null);
  const [imageError, setImageError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async (index: number, file?: File) => {
    if (!file) return;
    setImageResult(null);
    try {
      const dataUrl = await inspectImage(await readFileAsDataUrl(file), file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg"));
      const source: ComparisonFile = {id: String(index), name:file.name, type:"image", size:file.size, mimeType:file.type, dataUrl};
      setImages(previous => previous.map((value, i) => i === index ? source : value));
      setImageError("");
    } catch (cause) { setImageError(cause instanceof Error ? cause.message : "Could not open image."); }
  };
  const compareImages = async (threshold = 0.1) => {
    if (!images[0] || !images[1]) return;
    setBusy(true);
    try { setImageResult(await computeImageDiff(images[0], images[1], threshold)); setImageError(""); }
    catch (cause) { setImageError(cause instanceof Error ? cause.message : "Could not compare."); }
    finally { setBusy(false); }
  };
  return <main className="app-shell">
    <h1>Diffs</h1><p>Compare locally in your browser.</p>
    <label>Compare as<select value={format} onChange={e=>setFormat(e.target.value as typeof format)}>
      <option value="text">Source text</option><option value="json">JSON fields</option><option value="table">Table records</option></select></label>
    <div className="diff-column-headings">
      <label>Original<textarea aria-label="Original" value={oldText} onChange={e=>setOldText(e.target.value)} /></label>
      <label>Modified<textarea aria-label="Modified" value={newText} onChange={e=>setNewText(e.target.value)} /></label>
    </div>
{format === "text" ? <TextDiffViewer oldText={oldText} newText={newText} /> : <PastedComparison oldText={oldText} newText={newText} format={format} />}
<section><h2>Images</h2>
      {[0,1].map(index=><label key={index}>{index===0 ? "Original image" : "Modified image"}<input type="file" accept="image/*" disabled={busy} onChange={e=>void load(index,e.target.files?.[0])}/></label>)}
      <button disabled={busy || !images[0] || !images[1]} onClick={()=>void compareImages()}>Compare images</button>
      {imageError && <p role="alert">{imageError}</p>}
      {imageResult && <ImageDiffViewer diff={imageResult} originalName={images[0]?.name ?? "Original"} modifiedName={images[1]?.name ?? "Modified"} onThresholdChange={value=>void compareImages(value)} busy={busy}/>}
    </section>
</main>;
}
