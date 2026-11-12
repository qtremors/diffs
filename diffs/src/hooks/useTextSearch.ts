"use client";
import { useId, useRef, useState, useEffect, useCallback } from "react";
import type { TextSide } from "@/lib/comparison/review";

export function useTextSearch() {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [side, setSide] = useState<TextSide>("modified");
  const [matchCase, setMatchCase] = useState(false);
  const [index, setIndex] = useState(0);
  const [request, requestReveal] = useState(0);
  const inputRef = useCallback((element: HTMLInputElement | null) => { input.current = element; }, []);
  const buttonRef = useCallback((element: HTMLButtonElement | null) => { button.current = element; }, []);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  const reveal = () => requestReveal((value) => value + 1);
  const close = () => { setOpen(false); button.current?.focus(); };
  return {
    id, inputRef, buttonRef, open, query: open ? query : "", value: query, side, matchCase, index, request,
    show: () => { setOpen(true); if (open) input.current?.focus(); },
    close,
    setQuery: (value: string) => { setQuery(value); setIndex(0); reveal(); },
    setSide: (value: TextSide) => { setSide(value); setIndex(0); reveal(); },
    setMatchCase: (value: boolean) => { setMatchCase(value); setIndex(0); reveal(); },
    navigate: (direction: number, count: number) => {
      if (!count) return;
      setIndex((previous) => (Math.min(previous, count - 1) + direction + count) % count);
      reveal();
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
        input.current?.focus();
      } else if (open && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    },
  };
}
