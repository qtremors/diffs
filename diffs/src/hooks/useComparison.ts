// ---------------------------------------------------------------------------
// useComparison — state machine for the comparison lifecycle
// ---------------------------------------------------------------------------

import { useState, useCallback, useEffect } from "react";
import type { ComparisonFile, ComparisonPair, ComparisonResult } from "@/lib/types";
import { compare } from "@/lib/comparison/engine";
import { saveFiles, loadFiles, clearStorage } from "@/lib/utils/storage";

interface ComparisonState {
  files: ComparisonFile[];
  originalId: string | null;
  pairs: ComparisonPair[];
  isComparing: boolean;
  error: string | null;
  isRestored: boolean;
}

export function useComparison() {
  const [state, setState] = useState<ComparisonState>({
    files: [],
    originalId: null,
    pairs: [],
    isComparing: false,
    error: null,
    isRestored: false,
  });

  // Restore files from IndexedDB on mount
  useEffect(() => {
    loadFiles()
      .then(({ files, originalId }) => {
        if (files.length > 0) {
          setState((prev) => ({
            ...prev,
            files,
            originalId: originalId ?? (files.length > 0 ? files[0].id : null),
            isRestored: true,
          }));
        } else {
          setState((prev) => ({ ...prev, isRestored: true }));
        }
      })
      .catch(() => {
        setState((prev) => ({ ...prev, isRestored: true }));
      });
  }, []);

  // Persist files to IndexedDB whenever they change
  useEffect(() => {
    if (!state.isRestored) return;
    saveFiles(state.files, state.originalId).catch(() => {
      // Silent fail — storage is best-effort
    });
  }, [state.files, state.originalId, state.isRestored]);

  /** Add files to the comparison set */
  const addFiles = useCallback((newFiles: ComparisonFile[]) => {
    setState((prev) => {
      const updated = [...prev.files, ...newFiles];
      const originalId = prev.originalId ?? (updated.length > 0 ? updated[0].id : null);
      return { ...prev, files: updated, originalId, pairs: [], error: null };
    });
  }, []);

  /** Remove a file by ID */
  const removeFile = useCallback((fileId: string) => {
    setState((prev) => {
      const files = prev.files.filter((f) => f.id !== fileId);
      let originalId = prev.originalId;
      if (originalId === fileId) {
        originalId = files.length > 0 ? files[0].id : null;
      }
      return { ...prev, files, originalId, pairs: [], error: null };
    });
  }, []);

  /** Select a file as the original (baseline) */
  const selectOriginal = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      originalId: fileId,
      pairs: [],
      error: null,
    }));
  }, []);

  /** Run comparison: original vs all other files */
  const runComparison = useCallback(async () => {
    setState((prev) => ({ ...prev, isComparing: true, error: null }));

    try {
      const current = await new Promise<ComparisonState>((resolve) => {
        setState((prev) => {
          resolve(prev);
          return prev;
        });
      });

      const original = current.files.find((f) => f.id === current.originalId);
      if (!original) {
        setState((prev) => ({
          ...prev,
          isComparing: false,
          error: "No original file selected.",
        }));
        return;
      }

      const modifiedFiles = current.files.filter((f) => f.id !== current.originalId);
      if (modifiedFiles.length === 0) {
        setState((prev) => ({
          ...prev,
          isComparing: false,
          error: "Add at least one more file to compare.",
        }));
        return;
      }

      const pairs: ComparisonPair[] = await Promise.all(
        modifiedFiles.map(async (modified): Promise<ComparisonPair> => {
          let result: ComparisonResult;
          try {
            result = await compare(original, modified);
          } catch (err) {
            result = {
              type: "incompatible",
              reason: err instanceof Error ? err.message : "Comparison failed.",
            };
          }
          return { original, modified, result };
        })
      );

      setState((prev) => ({ ...prev, pairs, isComparing: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isComparing: false,
        error: err instanceof Error ? err.message : "Comparison failed.",
      }));
    }
  }, []);

  /** Clear all state and storage */
  const reset = useCallback(async () => {
    await clearStorage().catch(() => {});
    setState({
      files: [],
      originalId: null,
      pairs: [],
      isComparing: false,
      error: null,
      isRestored: true,
    });
  }, []);

  return {
    ...state,
    addFiles,
    removeFile,
    selectOriginal,
    runComparison,
    reset,
  };
}
