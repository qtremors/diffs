"use client";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import type { useTextSearch } from "@/hooks/useTextSearch";
import type { TextSide } from "@/lib/comparison/review";
type SearchState = ReturnType<typeof useTextSearch>;

export function FindButton({ search: { buttonRef, show, open, id } }: { search: SearchState }) {
  return (
    <button type="button" className="btn-ghost" ref={buttonRef} onClick={show}
      aria-label="Find in text" aria-expanded={open} aria-controls={open ? id : undefined}
      title="Find in text (Ctrl or Command + F)">
      <Search size={14} /><span className="optional-label">Find</span>
    </button>
  );
}

export default function TextSearch({ search: {
  open, index, id, inputRef, value, setQuery, side, setSide, matchCase, setMatchCase, navigate, close,
}, count, truncated }: {
  search: SearchState; count: number; truncated: boolean;
}) {
  if (!open) return null;
  const current = Math.min(index, Math.max(0, count - 1));
  return (
    <div className="text-search" id={id} role="search" aria-label="Find in comparison">
      <input ref={inputRef} type="search" maxLength={1000} aria-label="Find text" placeholder="Find text…"
        value={value} onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            navigate(event.shiftKey ? -1 : 1, count);
          }
        }} />
      <select aria-label="Search in" value={side}
        onChange={(event) => setSide(event.target.value as TextSide)}>
        <option value="modified">Modified</option><option value="original">Original</option>
      </select>
      <label className="check-control">
        <input type="checkbox" checked={matchCase}
          onChange={(event) => setMatchCase(event.target.checked)} />
        Match case
      </label>
      <span className="search-count" role="status">
        {count ? `${current + 1} of ${count.toLocaleString()}${truncated ? "+" : ""} matches` : value ? "No matches" : "Enter text to find"}
      </span>
      <div className="search-navigation">
        <button type="button" className="icon-button" aria-label="Previous match" disabled={!count}
          onClick={() => navigate(-1, count)}><ArrowUp size={15} /></button>
        <button type="button" className="icon-button" aria-label="Next match" disabled={!count}
          onClick={() => navigate(1, count)}><ArrowDown size={15} /></button>
        <button type="button" className="icon-button" aria-label="Close find" onClick={close}><X size={15} /></button>
      </div>
      {truncated && <p className="search-note">Showing the first 2,000 matches. Refine your search to see more.</p>}
    </div>
  );
}
