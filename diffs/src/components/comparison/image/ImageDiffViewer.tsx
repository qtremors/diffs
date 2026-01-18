"use client";
import { useState, useId } from "react";
import {
  Columns2,
  SlidersHorizontal,
  Scan,
  Info,
  Download,
  Minus,
  Plus,
  Maximize2,
  LoaderCircle,
} from "lucide-react";
import type { ImageDiffResult } from "@/lib/types";
import Tabs from "@/components/ui/Tabs";
import ImageOverlay from "./ImageOverlay";
import ImageMetadata from "./ImageMetadata";
import { useImageZoom } from "@/hooks/useImageZoom";

export default function ImageDiffViewer({
  diff,
  originalName,
  modifiedName,
  onThresholdChange,
  busy,
}: {
  diff: ImageDiffResult;
  originalName: string;
  modifiedName: string;
  onThresholdChange: (threshold: number) => void;
  busy: boolean;
}) {
  const viewId = useId();
  const [mode, setMode] = useState("side-by-side");
  const [threshold, setThreshold] = useState(diff.threshold);
  const width = mode === "side-by-side" ? diff.width * 2 + 24 : diff.width;
  const {
    viewportRef,
    pointerProps,
    scale,
    isFit,
    style,
    zoomIn,
    zoomOut,
    fit,
    actual,
  } = useImageZoom(width, diff.height);
  const tabs = [
    { id: "side-by-side", label: "Side by side", icon: <Columns2 size={14} /> },
    { id: "overlay", label: "Wipe", icon: <SlidersHorizontal size={14} /> },
    { id: "difference", label: "Difference", icon: <Scan size={14} /> },
    { id: "details", label: "Details", icon: <Info size={14} /> },
  ];
  return (
    <div className="image-diff-viewer">
      <div className="result-toolbar">
        <div className="result-summary" role="status">
          {busy ? (
            <>
              <LoaderCircle className="spin" size={15} />
              Updating…
            </>
          ) : (
            <>
              <strong>
                {diff.diffPercentage === 0
                  ? "No pixel changes"
                  : `${diff.diffPercentage < 0.01 ? "<0.01" : diff.diffPercentage.toFixed(2)}% changed`}
              </strong>
              <span className="muted">
                {diff.diffPixelCount.toLocaleString()} pixels
              </span>
            </>
          )}
        </div>
        <div className="result-actions">
          <label className="select-control">
            Sensitivity
            <select
              aria-label="Sensitivity"
              value={busy ? threshold : diff.threshold}
              disabled={busy}
              onChange={(event) => {
                const value = Number(event.target.value);
                setThreshold(value);
                onThresholdChange(value);
              }}
            >
              <option value="0">Strict</option>
              <option value="0.1">Balanced</option>
              <option value="0.2">Relaxed</option>
            </select>
          </label>
          <a
            className={`btn-secondary ${busy ? "disabled" : ""}`}
            href={busy ? undefined : diff.diffDataUrl}
            download="difference.png"
            aria-disabled={busy}
          >
            <Download size={14} />
            Save image
          </a>
        </div>
      </div>
      <Tabs
        tabs={tabs}
        activeId={mode}
        onChange={(id) => {
          setMode(id);
          fit();
        }}
        label="Image view"
        id={viewId}
        panelId={`${viewId}-panel`}
      />
      <div
        id={`${viewId}-panel`}
        role="tabpanel"
        aria-labelledby={`${viewId}-${mode}`}
      >
        {!diff.dimensionsMatch && (
          <p className="result-note">
            Different dimensions. Images keep their original size and align at
            the top left; empty space is transparent.
          </p>
        )}
        {mode === "details" ? (
          <ImageMetadata original={diff.original} modified={diff.modified} />
        ) : (
          <>
            <div className="image-labels">
              <span title={originalName}>
                {mode === "difference" ? "Difference map" : originalName}
              </span>
              <span title={modifiedName}>
                {mode === "difference"
                  ? "White marks changed pixels"
                  : modifiedName}
              </span>
            </div>
            <div
              className={`image-stage ${isFit ? "" : "image-stage-zoomed"}`}
              ref={viewportRef}
              {...pointerProps}
              tabIndex={0}
              aria-label="Image viewer. Use zoom controls, pinch, or Ctrl and scroll. Drag to pan when zoomed."
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "+" || event.key === "=") {
                  event.preventDefault();
                  zoomIn();
                }
                if (event.key === "-") {
                  event.preventDefault();
                  zoomOut();
                }
                if (event.key === "0") {
                  event.preventDefault();
                  fit();
                }
              }}
            >
              <div className="image-world" style={style}>
                {mode === "side-by-side" ? (
                  <div className="image-pair-canvas">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={diff.originalDataUrl}
                      alt={originalName}
                      draggable={false}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={diff.modifiedDataUrl}
                      alt={modifiedName}
                      draggable={false}
                    />
                  </div>
                ) : mode === "overlay" ? (
                  <ImageOverlay
                    originalSrc={diff.originalDataUrl}
                    modifiedSrc={diff.modifiedDataUrl}
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="difference-image"
                      src={diff.diffDataUrl}
                      alt="Difference map. Changed pixels are white."
                      draggable={false}
                    />
                  </>
                )}
              </div>
            </div>
            <div className="image-bottom-bar">
              <span className="image-help">
                Drag to pan · Pinch or Ctrl + scroll to zoom
              </span>
              <div className="zoom-controls">
                <button
                  type="button"
                  className="icon-button"
                  onClick={zoomOut}
                  aria-label="Zoom out"
                >
                  <Minus size={14} />
                </button>
                <span className="zoom-value">{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  className="icon-button"
                  onClick={zoomIn}
                  aria-label="Zoom in"
                >
                  <Plus size={14} />
                </button>
                <span className="control-divider" />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={fit}
                  aria-pressed={isFit}
                >
                  <Maximize2 size={13} />
                  Fit
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={actual}
                  aria-pressed={!isFit && scale === 1}
                >
                  1:1
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <p className="result-note">
        Compares image pixels, including fine edge changes. Files and image
        details may differ even when the pixels match.
      </p>
    </div>
  );
}
