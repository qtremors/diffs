"use client";
import { useComparison } from "@/hooks/useComparison";
import TextDiffViewer from "@/components/comparison/text/TextDiffViewer";
import PastedComparison from "@/components/comparison/data/PastedComparison";
import JsonViewer from "@/components/comparison/data/JsonViewer";
import TableViewer from "@/components/comparison/data/TableViewer";
import ImageDiffViewer from "@/components/comparison/image/ImageDiffViewer";
export default function Home() {
  const app = useComparison();
  const pair = app.pairs.find(item => item.modified.id === app.activeId) ?? app.pairs[0];
  const result = pair?.result;
  return <main className="app-shell">
    <h1>Diffs</h1>
    <div className="section-actions"><button onClick={()=>app.setMode("files")}>Files</button><button onClick={()=>app.setMode("text")}>Paste text</button><button onClick={app.reset}>Reset</button></div>
    {app.errors.length > 0 && <div role="alert">{app.errors.map((error,index)=><p key={index}>{error}</p>)}<button onClick={app.dismissErrors}>Dismiss</button></div>}
    {app.mode === "files" ? <>
<input aria-label="Select files" type="file" multiple disabled={app.isReading} onChange={e=>void app.addSelectedFiles(Array.from(e.target.files ?? []))}/>
      <p>Choose the original, then compare each candidate.</p>
      {app.files.map(file=><div key={file.id}><button onClick={()=>app.selectOriginal(file.id)} aria-pressed={file.id===app.originalId}>{file.name}</button><button onClick={()=>app.removeFile(file.id)}>Remove</button></div>)}
      <button disabled={app.files.length<2 || app.isComparing || app.isReading} onClick={app.runComparison}>Compare files</button>
      {app.isComparing && <button onClick={app.cancel}>Cancel</button>}
      {app.pairs.map(item=><button key={item.modified.id} onClick={()=>app.selectCandidate(item.modified.id)}>{item.modified.name}</button>)}
      {result?.type === "text" && pair && <TextDiffViewer oldText={pair.original.textContent ?? ""} newText={pair.modified.textContent ?? ""} result={result} />}
      {result?.type === "json" && <JsonViewer result={result}/>}
      {result?.type === "table" && <TableViewer result={result}/>}
      {result?.type === "image" && pair && <ImageDiffViewer diff={result.diff} originalName={pair.original.name} modifiedName={pair.modified.name} onThresholdChange={imageThreshold=>app.selectCandidate(pair.modified.id,{imageThreshold})} busy={app.isComparing}/>}
      {result?.type === "error" && <p role="alert">{result.reason}</p>}
      {result && ["binary","pdf","folder"].includes(result.type) && <pre>{JSON.stringify(result,null,2)}</pre>}
</> : <>
      <label>Compare as<select value={app.pasteFormat} onChange={e=>app.setPasteFormat(e.target.value as typeof app.pasteFormat)}><option value="text">Source text</option><option value="json">JSON fields</option><option value="table">Table records</option></select></label>
      <div className="diff-column-headings"><label>Original<textarea aria-label="Original" value={app.oldText} onChange={e=>app.setText("oldText",e.target.value)}/></label><label>Modified<textarea aria-label="Modified" value={app.newText} onChange={e=>app.setText("newText",e.target.value)}/></label></div>
      {app.pasteFormat === "text" ? <TextDiffViewer oldText={app.oldText} newText={app.newText}/> : <PastedComparison oldText={app.oldText} newText={app.newText} format={app.pasteFormat}/>}
    </>}
</main>;
}
