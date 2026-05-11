"use client";
import { useState, useRef, useEffect } from "react";
import type { SessionData } from "@/lib/types";
import { loadSession, persistSession } from "@/lib/utils/storage";
export function useWorkspaceStorage(
  data: SessionData,
  update: (next: SessionData) => void,
  getSnapshot: () => SessionData,
  reportErrors: (errors: string[]) => void,
) {
  const [ready, setReady] = useState(false);
  const [remember, setEnabled] = useState(false);
  const [persistence, setPersistence] = useState<{
    snapshot: SessionData | null;
    message: string;
  }>({ snapshot: null, message: "Temporary session" });
  const revision = useRef(0);
  const blocked = useRef(false);
  useEffect(() => {
    let alive = true;
    loadSession()
      .then(({ data: restored, remember: enabled }) => {
        if (!alive) return;
        if (restored) update(restored);
        setEnabled(enabled);
        setReady(true);
      })
      .catch((error) => {
        if (!alive) return;
        blocked.current = true;
        reportErrors([
          error instanceof Error
            ? error.message
            : "Your saved session could not be restored. Reset to clear it, or keep working temporarily.",
        ]);
        setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [update, reportErrors]);
  useEffect(() => {
    if (!ready || blocked.current) return;
    const current = ++revision.current;
    let alive = true;
    const timer = setTimeout(() => {
      persistSession(data, remember)
        .then(() => {
          if (alive && revision.current === current)
            setPersistence({
              snapshot: data,
              message: remember
                ? "Saved in this browser tab"
                : "Temporary session",
            });
        })
        .catch((error) => {
          if (alive && revision.current === current)
            setPersistence({
              snapshot: data,
              message:
                error instanceof Error
                  ? error.message
                  : "Saving is unavailable",
            });
        });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [data, remember, ready]);
  const saveImmediately = (snapshot: SessionData, enabled: boolean) => {
    blocked.current = false;
    setEnabled(enabled);
    revision.current++;
    void persistSession(snapshot, enabled).catch((error) =>
      reportErrors([
        error instanceof Error ? error.message : "Storage is unavailable.",
      ]),
    );
  };
  return {
    ready,
    remember,
    storageStatus:
      remember && persistence.snapshot !== data
        ? "Saving…"
        : persistence.message,
    setRemember: (enabled: boolean) => saveImmediately(getSnapshot(), enabled),
    clearSaved: (snapshot: SessionData) => saveImmediately(snapshot, false),
  };
}
