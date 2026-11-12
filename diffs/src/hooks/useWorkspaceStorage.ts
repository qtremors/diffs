"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import type { SessionData } from "@/lib/types";
import { loadSession, persistSession } from "@/lib/utils/storage";

const temporary = "Temporary session. Nothing is uploaded.";
type StorageState = {
  snapshot: SessionData | null;
  message: string;
  recovery: boolean;
  deletion: "none" | "pending" | "failed";
};

export function useWorkspaceStorage(
  data: SessionData,
  update: (next: SessionData) => void,
  getSnapshot: () => SessionData,
  reportErrors: (errors: string[]) => void,
) {
  const [ready, setReady] = useState(false);
  const [remember, setEnabled] = useState(false);
  const [state, setState] = useState<StorageState>({
    snapshot: null, message: temporary, recovery: false, deletion: "none",
  });
  const revision = useRef(0);
  const blocked = useRef(false);
  const immediate = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    loadSession()
      .then(({ data: restored, remember: enabled, deletionPending }) => {
        if (!alive) return;
        if (restored) update(restored);
        blocked.current = deletionPending;
        setEnabled(enabled);
        setState({
          snapshot: restored,
          message: deletionPending
            ? "A saved copy still needs to be deleted. Retry deletion."
            : enabled ? "Saved in this browser tab" : temporary,
          recovery: deletionPending,
          deletion: deletionPending ? "failed" : "none",
        });
        setReady(true);
      })
      .catch((error) => {
        if (!alive) return;
        blocked.current = true;
        setState({ snapshot: null, message: "Saved session could not be restored. Reset to clear it.",
          recovery: true, deletion: "none" });
        reportErrors([error instanceof Error ? error.message : "Your saved session could not be restored."]);
        setReady(true);
      });
    return () => { alive = false; };
  }, [update, reportErrors]);

  useEffect(() => {
    if (!ready || !remember || blocked.current) return;
    const current = revision.current;
    let alive = true;
    let started = false;
    const save = () => {
      if (started || current !== revision.current || blocked.current) return;
      started = true;
      clearTimeout(timer);
      persistSession(data, true).then(
        () => {
          if (alive && revision.current === current)
            setState({ snapshot: data, message: "Saved in this browser tab", recovery: false, deletion: "none" });
        },
        (error) => {
          if (alive && revision.current === current)
            setState({ snapshot: data, message: error instanceof Error ? error.message : "Saving is unavailable.",
              recovery: true, deletion: "none" });
        },
      );
    };
    const timer = setTimeout(save, immediate.current ? 0 : 300);
    immediate.current = false;
    const background = () => { if (document.visibilityState === "hidden") save(); };
    document.addEventListener("visibilitychange", background);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", background);
    };
  }, [data, remember, ready]);

  const deleteSaved = useCallback((snapshot: SessionData) => {
    const current = ++revision.current;
    blocked.current = true;
    setEnabled(false);
    setState({ snapshot: null, message: "Deleting saved copy…", recovery: true, deletion: "pending" });
    void persistSession(snapshot, false).then(
      () => {
        if (!mounted.current || current !== revision.current) return;
        blocked.current = false;
        setState({ snapshot: null, message: temporary, recovery: false, deletion: "none" });
      },
      (error) => {
        if (!mounted.current || current !== revision.current) return;
        const message = error instanceof Error ? error.message : "The saved copy could not be deleted. Retry deletion.";
        setState({ snapshot: null, message, recovery: true, deletion: "failed" });
        reportErrors([message]);
      },
    );
  }, [reportErrors]);

  return {
    ready,
    remember,
    storageRecovery: state.recovery,
    deletingSaved: state.deletion === "pending",
    deletionFailed: state.deletion === "failed",
    storageStatus: remember && state.snapshot !== data ? "Saving…" : state.message,
    setRemember: (enabled: boolean) => {
      if (!enabled) { deleteSaved(getSnapshot()); return; }
      if (state.deletion !== "none") return;
      revision.current++;
      blocked.current = false;
      immediate.current = true;
      setState({ snapshot: null, message: "Saving…", recovery: false, deletion: "none" });
      setEnabled(true);
    },
    retryDeletion: () => deleteSaved(getSnapshot()),
    clearSaved: deleteSaved,
  };
}
