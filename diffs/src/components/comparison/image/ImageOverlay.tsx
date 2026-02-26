"use client";

// ---------------------------------------------------------------------------
// ImageOverlay — swipe/slider overlay comparison with zoom
// ---------------------------------------------------------------------------

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useImageZoom } from "@/hooks/useImageZoom";
import { RotateCcw } from "lucide-react";

interface ImageOverlayProps {
  originalSrc: string;
  modifiedSrc: string;
}

export default function ImageOverlay({ originalSrc, modifiedSrc }: ImageOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const { zoom, containerStyle, containerProps, resetZoom, isZoomed } = useImageZoom();

  const updateSlider = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleMouseDown = useCallback(() => {
    if (!isZoomed) setIsDragging(true);
  }, [isZoomed]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateSlider(e.clientX);
    };
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateSlider]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      updateSlider(e.touches[0].clientX);
    },
    [updateSlider]
  );

  return (
    <div className="image-viewport" ref={containerRef} {...containerProps}>
      <div className="image-viewport-inner" style={containerStyle}>
        {/* Modified image — full background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={modifiedSrc}
          alt="Modified"
          className="overlay-image overlay-image-bg"
        />

        {/* Original image — clipped via clip-path */}
        <div
          className="overlay-original"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalSrc}
            alt="Original"
            className="overlay-image"
          />
        </div>

        {/* Slider handle */}
        <div
          className="overlay-slider"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onTouchMove={handleTouchMove}
          role="slider"
          aria-valuenow={Math.round(sliderPos)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Image comparison slider"
          tabIndex={0}
        >
          <div className="overlay-slider-line" />
          <div className="overlay-slider-handle">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 1L1 6L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 1L11 6L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="overlay-labels">
          <span className="overlay-label overlay-label-original">Original</span>
          <span className="overlay-label overlay-label-modified">Modified</span>
        </div>
      </div>

      {/* Zoom indicator */}
      {isZoomed && (
        <div className="zoom-indicator">
          <span>{Math.round(zoom.scale * 100)}%</span>
          <button className="zoom-reset-btn" onClick={resetZoom} title="Reset zoom">
            <RotateCcw size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
