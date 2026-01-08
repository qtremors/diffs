"use client";
import { useState, useRef, useEffect } from "react";
import { runWorker } from "@/lib/comparison/client";
import { downloadFile } from "@/lib/utils/file";
export function useTextActions(
  oldText: string,
  newText: string,
  originalName = "Original",
  modifiedName = "Modified",
) {
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const job = useRef<AbortController | null>(null);
  useEffect(() => () => job.current?.abort(), []);
  const exportPatch = async () => {
    job.current?.abort();
    const controller = new AbortController();
    job.current = controller;
    setExporting(true);
    setMessage("");
    try {
      const patch = await runWorker(
        { kind: "patch", oldText, newText, originalName, modifiedName },
        controller.signal,
      );
      downloadFile(patch, "comparison.patch", "text/x-diff;charset=utf-8");
      setMessage("Patch downloaded. It includes all source changes.");
    } catch (error) {
      if (!controller.signal.aborted)
        setMessage(
          error instanceof Error ? error.message : "Patch export failed.",
        );
    } finally {
      if (!controller.signal.aborted) setExporting(false);
    }
  };
  const copy = () => {
    void navigator.clipboard.writeText(newText).then(
      () => setMessage("Modified text copied."),
      () =>
        setMessage("Copy is unavailable. Select and copy the text instead."),
    );
  };
  return { message, exporting, exportPatch, copy };
}
