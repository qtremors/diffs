"use client";
import { Copy } from "lucide-react";
import type { ChangeBlock, TextSide } from "@/lib/comparison/review";

export default function ChangeBlockActions({ block, index, count, pending, onCopy }: {
  block?: ChangeBlock; index: number; count: number; pending?: boolean;
  onCopy: (side: TextSide, text: string) => void;
}) {
  return (
    <div className="change-block-actions" role="group" aria-label="Copy changed block">
      <span>{pending ? "Comparing…" : count ? `Change ${index + 1} of ${count}` : "No changed blocks"}</span>
      {(["original", "modified"] as const).map((side) => (
        <button key={side} type="button" className="btn-secondary"
          aria-label={`Copy ${side} change`} disabled={pending || !block?.[side]}
          title={block?.[side] ? "Copy this changed block with its original whitespace and line endings" : `This change has no ${side} text`}
          onClick={() => { if (block) onCopy(side, block[side]); }}>
          <Copy size={14} />Copy {side}
        </button>
      ))}
    </div>
  );
}
