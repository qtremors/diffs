"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { constrainImagePan } from "@/lib/utils/image";

export function useImageZoom(width: number, height: number) {
  const [viewport, viewportRef] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 480 });
  const [view, setView] = useState<{
    scale: number | null;
    x: number;
    y: number;
  }>({ scale: null, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef({ distance: 0, scale: 1 });
  const fitScale = Math.min(
    1,
    Math.max(1, size.width - 40) / width,
    Math.max(1, size.height - 40) / height,
  );
  const scale = view.scale ?? fitScale;
  const position = constrainImagePan(view, { width, height }, size, scale);
  const zoomTo = useCallback((next: number | ((current: number) => number)) => {
    setView((prev) => {
      const nextScale = typeof next === "function" ? next(prev.scale ?? fitScale) : next;
      const scale = Math.max(Math.min(fitScale, 0.1), Math.min(8, nextScale));
      return { scale, ...constrainImagePan(prev, { width, height }, size, scale) };
    });
  }, [fitScale, width, height, size]);
  const pan = (x: number, y: number) => setView((prev) => {
    const scale = prev.scale ?? fitScale;
    const current = constrainImagePan(prev, { width, height }, size, scale);
    return { ...prev, ...constrainImagePan(
      { x: current.x + x, y: current.y + y }, { width, height }, size, scale,
    ) };
  });

  useEffect(() => {
    const element = viewport;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [viewport]);

  useEffect(() => {
    const element = viewport;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      zoomTo((scale) => scale * (event.deltaY > 0 ? 0.9 : 1.1));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [zoomTo, viewport]);

  const pointerProps = {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (
        event.button !== 0 ||
        (event.target as HTMLElement).closest("[data-no-pan]")
      )
        return;
      event.currentTarget.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale };
      }
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      const last = pointers.current.get(event.pointerId);
      if (!last) return;
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        zoomTo((pinch.current.scale * Math.hypot(a.x - b.x, a.y - b.y)) /
          Math.max(1, pinch.current.distance));
      } else if (scale > fitScale + 0.001)
        pan(event.clientX - last.x, event.clientY - last.y);
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      pointers.current.delete(event.pointerId);
    },
    onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => {
      pointers.current.delete(event.pointerId);
    },
    onLostPointerCapture: (event: React.PointerEvent<HTMLDivElement>) => {
      pointers.current.delete(event.pointerId);
    },
  };
  return {
    viewportRef,
    pointerProps,
    scale,
    isFit: view.scale === null,
    canPan: width * scale > size.width - 40 || height * scale > size.height - 40,
    pan,
    style: {
      width,
      height,
      transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
    },
    zoomIn: () => zoomTo((scale) => scale * 1.25),
    zoomOut: () => zoomTo((scale) => scale / 1.25),
    fit: () => setView({ scale: null, x: 0, y: 0 }),
    actual: () => setView({ scale: 1, x: 0, y: 0 }),
  };
}
