"use client";
import { useComparison } from "@/hooks/useComparison";
import TextDiffViewer from "@/components/comparison/text/TextDiffViewer";
import PastedComparison from "@/components/comparison/data/PastedComparison";
import FileWorkspace from "@/components/comparison/FileWorkspace";
import ComparisonView from "@/components/comparison/ComparisonView";
export default function Home() {
  const app = useComparison();
  const pair = app.pairs.find(item => item.modified.id === app.activeId) ?? app.pairs[0];
  const result = pair?.result;
  return <main className="app-shell">
    <h1>Diffs</h1>
    <div className="section-actions"><button onClick={()=>app.setMode("files")}>Files</button><button onClick={()=>app.setMode("text")}>Paste text</button><button onClick={app.reset}>Reset</button></div>
    {app.errors.length > 0 && <div role="alert">{app.errors.map((error,index)=><p key={index}>{error}</p>)}<button onClick={app.dismissErrors}>Dismiss</button></div>}
    {app.mode === "files" ? <>
<FileWorkspace app={app}/><ComparisonView pairs={app.pairs} activeId={app.activeId} onSelect={app.selectCandidate} busy={app.isComparing} onRetry={app.runComparison}/>
</> : <>
      <label>Compare as<select value={app.pasteFormat} onChange={e=>app.setPasteFormat(e.target.value as typeof app.pasteFormat)}><option value="text">Source text</option><option value="json">JSON fields</option><option value="table">Table records</option></select></label>
      <div className="diff-column-headings"><label>Original<textarea aria-label="Original" value={app.oldText} onChange={e=>app.setText("oldText",e.target.value)}/></label><label>Modified<textarea aria-label="Modified" value={app.newText} onChange={e=>app.setText("newText",e.target.value)}/></label></div>
      {app.pasteFormat === "text" ? <TextDiffViewer oldText={app.oldText} newText={app.newText}/> : <PastedComparison oldText={app.oldText} newText={app.newText} format={app.pasteFormat}/>}
    </>}
<label><input type="checkbox" checked={app.remember} disabled={!app.ready} onChange={e=>app.setRemember(e.target.checked)}/>Remember this tab</label><p role="status">{app.storageStatus}</p>
</main>;
}
