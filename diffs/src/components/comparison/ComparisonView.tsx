"use client";

// ---------------------------------------------------------------------------
// ComparisonView — routes each comparison pair to the right viewer
// ---------------------------------------------------------------------------

import React, { useState } from "react";
import type { ComparisonPair } from "@/lib/types";
import Tabs from "@/components/ui/Tabs";
import TextDiffViewer from "@/components/comparison/text/TextDiffViewer";
import ImageDiffViewer from "@/components/comparison/image/ImageDiffViewer";
import { AlertTriangle } from "lucide-react";

interface ComparisonViewProps {
  pairs: ComparisonPair[];
}

export default function ComparisonView({ pairs }: ComparisonViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (pairs.length === 0) return null;

  // Build tabs from pairs
  const tabs = pairs.map((pair, i) => ({
    id: String(i),
    label: pair.modified.name,
    badge: pair.result?.type === "incompatible" ? "!" : undefined,
  }));

  const activePair = pairs[activeIndex] ?? pairs[0];

  return (
    <div className="comparison-view">
      {/* Show tabs only if multiple pairs */}
      {pairs.length > 1 && (
        <Tabs
          tabs={tabs}
          activeId={String(activeIndex)}
          onChange={(id) => setActiveIndex(Number(id))}
        />
      )}

      <div className="comparison-view-content">
        {renderPair(activePair)}
      </div>
    </div>
  );
}

function renderPair(pair: ComparisonPair) {
  if (!pair.result) {
    return <div className="comparison-empty">Comparison not yet run.</div>;
  }

  switch (pair.result.type) {
    case "text":
      return (
        <TextDiffViewer
          oldText={pair.original.textContent ?? ""}
          newText={pair.modified.textContent ?? ""}
          originalName={pair.original.name}
          modifiedName={pair.modified.name}
        />
      );

    case "image":
      return (
        <ImageDiffViewer
          originalSrc={pair.original.dataUrl ?? ""}
          modifiedSrc={pair.modified.dataUrl ?? ""}
          originalFile={{
            name: pair.original.name,
            size: pair.original.size,
            type: pair.original.mimeType,
          }}
          modifiedFile={{
            name: pair.modified.name,
            size: pair.modified.size,
            type: pair.modified.mimeType,
          }}
        />
      );

    case "incompatible":
      return (
        <div className="comparison-incompatible">
          <AlertTriangle size={20} />
          <p>{pair.result.reason}</p>
        </div>
      );

    default:
      return null;
  }
}
