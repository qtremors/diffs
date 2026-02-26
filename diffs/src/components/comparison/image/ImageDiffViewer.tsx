"use client";

// ---------------------------------------------------------------------------
// ImageDiffViewer — orchestrator for image comparison modes
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from "react";
import type { ImageDiffResult } from "@/lib/types";
import { computeImageDiff } from "@/lib/comparison/image";
import Tabs from "@/components/ui/Tabs";
import ImageOverlay from "@/components/comparison/image/ImageOverlay";
import ImageMetadata from "@/components/comparison/image/ImageMetadata";
import PixelDiffCanvas from "@/components/comparison/image/PixelDiffCanvas";
import { Layers, SlidersHorizontal, Grid3X3, Info } from "lucide-react";

interface ImageDiffViewerProps {
  originalSrc: string;
  modifiedSrc: string;
  originalFile: { name: string; size: number; type: string };
  modifiedFile: { name: string; size: number; type: string };
}

type ViewMode = "side-by-side" | "overlay" | "pixel-diff" | "metadata";

export default function ImageDiffViewer({
  originalSrc,
  modifiedSrc,
  originalFile,
  modifiedFile,
}: ImageDiffViewerProps) {
  const [activeMode, setActiveMode] = useState<ViewMode>("side-by-side");
  const [diffResult, setDiffResult] = useState<ImageDiffResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    computeImageDiff(
      { ...originalFile, dataUrl: originalSrc },
      { ...modifiedFile, dataUrl: modifiedSrc }
    )
      .then((result) => {
        if (!cancelled) {
          setDiffResult(result);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [originalSrc, modifiedSrc, originalFile, modifiedFile]);

  const tabs = [
    { id: "side-by-side", label: "Side by Side", icon: <Layers size={14} /> },
    { id: "overlay", label: "Overlay", icon: <SlidersHorizontal size={14} /> },
    { id: "pixel-diff", label: "Pixel Diff", icon: <Grid3X3 size={14} /> },
    { id: "metadata", label: "Metadata", icon: <Info size={14} /> },
  ];

  return (
    <div className="image-diff-container">
      <Tabs
        tabs={tabs}
        activeId={activeMode}
        onChange={(id) => setActiveMode(id as ViewMode)}
      />

      <div className="image-diff-content">
        {activeMode === "side-by-side" && (
          <div className="image-side-by-side">
            <div className="image-panel">
              <div className="diff-header">Original</div>
              <div className="image-panel-content">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalSrc} alt="Original" className="image-preview" />
              </div>
            </div>
            <div className="image-panel">
              <div className="diff-header">Modified</div>
              <div className="image-panel-content">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={modifiedSrc} alt="Modified" className="image-preview" />
              </div>
            </div>
          </div>
        )}

        {activeMode === "overlay" && (
          <ImageOverlay originalSrc={originalSrc} modifiedSrc={modifiedSrc} />
        )}

        {activeMode === "pixel-diff" && (
          isLoading ? (
            <div className="image-loading">Computing pixel diff...</div>
          ) : diffResult ? (
            <PixelDiffCanvas
              diffDataUrl={diffResult.diffDataUrl}
              diffPixelCount={diffResult.diffPixelCount}
              diffPercentage={diffResult.diffPercentage}
              totalPixels={diffResult.totalPixels}
            />
          ) : (
            <div className="image-error">Failed to compute pixel diff.</div>
          )
        )}

        {activeMode === "metadata" && (
          isLoading ? (
            <div className="image-loading">Loading metadata...</div>
          ) : diffResult ? (
            <ImageMetadata
              original={diffResult.original}
              modified={diffResult.modified}
            />
          ) : (
            <div className="image-error">Failed to load metadata.</div>
          )
        )}
      </div>
    </div>
  );
}
