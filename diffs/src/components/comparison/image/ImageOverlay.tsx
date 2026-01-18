"use client";
import { useState } from "react";

export default function ImageOverlay({
  originalSrc,
  modifiedSrc,
}: {
  originalSrc: string;
  modifiedSrc: string;
}) {
  const [position, setPosition] = useState(50);
  return (
    <div className="overlay-canvas">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={modifiedSrc} alt="Modified image" draggable={false} />
      <div
        className="overlay-original"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={originalSrc} alt="Original image" draggable={false} />
      </div>
      <div className="overlay-divider" style={{ left: `${position}%` }}>
        <span>↔</span>
      </div>
      <input
        className="overlay-range"
        type="range"
        min="0"
        max="100"
        step="1"
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label="Image comparison slider"
        data-no-pan
        onPointerDown={(event) => event.stopPropagation()}
      />
    </div>
  );
}
