"use client";

// ---------------------------------------------------------------------------
// PixelDiffCanvas — renders the pixel-level diff output with zoom
// ---------------------------------------------------------------------------

import React from "react";
import { useImageZoom } from "@/hooks/useImageZoom";
import { RotateCcw } from "lucide-react";

interface PixelDiffCanvasProps {
  diffDataUrl: string;
  diffPixelCount: number;
  diffPercentage: number;
  totalPixels: number;
}

export default function PixelDiffCanvas({
  diffDataUrl,
  diffPixelCount,
  diffPercentage,
  totalPixels,
}: PixelDiffCanvasProps) {
  const { zoom, containerStyle, containerProps, resetZoom, isZoomed } = useImageZoom();

  return (
    <div className="pixel-diff-container">
      <div className="pixel-diff-stats">
        <div className="pixel-diff-stat">
          <span className="pixel-diff-stat-value">{diffPercentage.toFixed(2)}%</span>
          <span className="pixel-diff-stat-label">Pixels Changed</span>
        </div>
        <div className="pixel-diff-stat">
          <span className="pixel-diff-stat-value">{diffPixelCount.toLocaleString()}</span>
          <span className="pixel-diff-stat-label">Diff Pixels</span>
        </div>
        <div className="pixel-diff-stat">
          <span className="pixel-diff-stat-value">{totalPixels.toLocaleString()}</span>
          <span className="pixel-diff-stat-label">Total Pixels</span>
        </div>
      </div>

      <div className="image-viewport" {...containerProps}>
        <div className="image-viewport-inner" style={containerStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={diffDataUrl}
            alt="Pixel-level difference map"
            className="pixel-diff-image"
          />
        </div>

        {isZoomed && (
          <div className="zoom-indicator">
            <span>{Math.round(zoom.scale * 100)}%</span>
            <button className="zoom-reset-btn" onClick={resetZoom} title="Reset zoom">
              <RotateCcw size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
