"use client";
import { useState, useRef, useCallback } from "react";
import type { SessionData } from "@/lib/types";
import { usePairComparison } from "@/hooks/usePairComparison";
import { useFileSources } from "@/hooks/useFileSources";
const emptySession = (): SessionData => ({
  files: [],
  originalId: null,
  oldText: "",
  newText: "",
  mode: "files",
  pasteFormat: "text",
});

/** Composes independent source, job, and retention lifecycles for the page. */
export function useComparison() {
  const [data, setData] = useState<SessionData>(emptySession);
  const [errors, setErrors] = useState<string[]>([]);
  const live = useRef(data);
  const update = useCallback((next: SessionData) => {
    live.current = next;
    setData(next);
  }, []);
  const getSnapshot = useCallback(() => live.current, []);
  const jobs = usePairComparison(getSnapshot);
  const { invalidate } = jobs;
  const changeFiles = useCallback(
    (files: SessionData["files"], originalId: string | null) => {
      invalidate();
      update({ ...getSnapshot(), files, originalId });
    },
    [invalidate, update, getSnapshot],
  );
  const sources = useFileSources(getSnapshot, changeFiles, setErrors);
  const storage = { ready: true, remember: false, storageStatus: "Temporary session", setRemember: (_enabled: boolean) => {}, clearSaved: (_snapshot: SessionData) => {} };
  return {
    ...data,
    ...jobs,
    ...sources,
    ready: storage.ready,
    remember: storage.remember,
    storageStatus: storage.storageStatus,
    setRemember: storage.setRemember,
    errors,
    selectOriginal: (id: string) => {
      const snapshot = getSnapshot();
      if (snapshot.files.some((file) => file.id === id))
        changeFiles(snapshot.files, id);
    },
    reset: () => {
      sources.cancelReading();
      invalidate();
      setErrors([]);
      const next = emptySession();
      update(next);
      storage.clearSaved(next);
    },
    setMode: (mode: SessionData["mode"]) => update({ ...getSnapshot(), mode }),
    setPasteFormat: (pasteFormat: SessionData["pasteFormat"]) =>
      update({ ...getSnapshot(), pasteFormat }),
    setText: (side: "oldText" | "newText", value: string) =>
      update({ ...getSnapshot(), [side]: value }),
    swapText: () => {
      const snapshot = getSnapshot();
      update({
        ...snapshot,
        oldText: snapshot.newText,
        newText: snapshot.oldText,
      });
    },
    reportError: (message: string) => setErrors([message]),
    dismissErrors: () => setErrors([]),
  };
}
