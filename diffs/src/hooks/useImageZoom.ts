// ---------------------------------------------------------------------------
// useImageZoom — scroll-to-zoom and drag-to-pan for image containers
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef, type WheelEvent, type MouseEvent } from "react";

interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const ZOOM_STEP = 0.15;

export function useImageZoom() {
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, translateX: 0, translateY: 0 });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setZoom((prev) => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + delta));

      // Reset pan when zooming back to 1
      if (newScale <= 1) {
        return { scale: 1, translateX: 0, translateY: 0 };
      }

      return { ...prev, scale: newScale };
    });
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (zoom.scale <= 1) return;
    e.preventDefault();
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [zoom.scale]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    e.preventDefault();

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    setZoom((prev) => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const resetZoom = useCallback(() => {
    setZoom({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  const containerStyle: React.CSSProperties = {
    transform: `translate(${zoom.translateX}px, ${zoom.translateY}px) scale(${zoom.scale})`,
    transformOrigin: "center center",
    transition: isPanning.current ? "none" : "transform 150ms ease-out",
    cursor: zoom.scale > 1 ? "grab" : "default",
  };

  const containerProps = {
    onWheel: handleWheel,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
  };

  return {
    zoom,
    containerStyle,
    containerProps,
    resetZoom,
    isZoomed: zoom.scale > 1,
  };
}
