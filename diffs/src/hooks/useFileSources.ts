"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type { SessionData } from "@/lib/types";
import { processFile, loadedFileSize } from "@/lib/utils/file";
import { processFolder } from "@/lib/utils/folder";
import { MAX_FILES, MAX_TOTAL_SIZE } from "@/lib/constants";

type ChangeFiles = (
  files: SessionData["files"],
  originalId: string | null,
) => void;
export function useFileSources(
  getSnapshot: () => SessionData,
  changeFiles: ChangeFiles,
  reportErrors: (errors: string[]) => void,
) {
  const [isReading, setIsReading] = useState(false);
  const [readingLabel, setReadingLabel] = useState("");
  const job = useRef<AbortController | null>(null);
  const revision = useRef(0);
  useEffect(() => () => job.current?.abort(), []);
  const cancelReading = useCallback(() => {
    revision.current++;
    job.current?.abort();
    setIsReading(false);
  }, []);
  const begin = () => {
    job.current?.abort();
    const controller = new AbortController();
    job.current = controller;
    const token = ++revision.current;
    setIsReading(true);
    reportErrors([]);
    return { controller, token };
  };
  const addSelectedFiles = async (selected: FileList | File[]) => {
    const { controller, token } = begin();
    const snapshot = getSnapshot();
    const incoming = Array.from(selected);
    const issues: string[] = [];
    const added: SessionData["files"] = [];
    let total = snapshot.files.reduce(
      (sum, file) => sum + loadedFileSize(file),
      0,
    );
    const slots = MAX_FILES - snapshot.files.length;
    if (incoming.length > slots)
      issues.push(
        `A session holds up to ${MAX_FILES} sources. Extra files were skipped.`,
      );
    for (const file of incoming.slice(0, slots)) {
      if (revision.current !== token) return;
      try {
        if (total + file.size > MAX_TOTAL_SIZE)
          throw new Error("The session limit is 30 MB. Remove a source first.");
        setReadingLabel(`Opening ${file.name}`);
        const result = await processFile(file, controller.signal, (message) => {
          if (revision.current === token)
            setReadingLabel(`${file.name}: ${message}`);
        });
        if (revision.current !== token) return;
        if (total + loadedFileSize(result) > MAX_TOTAL_SIZE)
          throw new Error(
            "The session limit is 30 MB, including rendered images. Remove a source first.",
          );
        added.push(result);
        total += loadedFileSize(result);
      } catch (error) {
        if (controller.signal.aborted) return;
        issues.push(
          `${file.name}: ${error instanceof Error ? error.message : "This file could not be opened."}`,
        );
      }
    }
    if (revision.current !== token) return;
    if (added.length) {
      const current = getSnapshot();
      const files = [...current.files, ...added];
      changeFiles(files, current.originalId ?? files[0].id);
    }
    reportErrors(issues);
    setIsReading(false);
  };
  const addFolder = async (selected: FileList) => {
    const { controller, token } = begin();
    setReadingLabel("Reading folder…");
    try {
      if (getSnapshot().files.length >= MAX_FILES)
        throw new Error("A session holds up to 12 sources. Remove one first.");
      const folder = await processFolder(
        selected,
        controller.signal,
        (message) => {
          if (revision.current === token) setReadingLabel(message);
        },
      );
      if (revision.current !== token) return;
      const snapshot = getSnapshot();
      if (
        snapshot.files.reduce((sum, file) => sum + loadedFileSize(file), 0) +
          folder.size >
        MAX_TOTAL_SIZE
      )
        throw new Error("The session limit is 30 MB. Remove a source first.");
      const files = [...snapshot.files, folder];
      changeFiles(files, snapshot.originalId ?? folder.id);
    } catch (error) {
      if (!controller.signal.aborted)
        reportErrors([
          error instanceof Error
            ? error.message
            : "Could not read this folder.",
        ]);
    } finally {
      if (revision.current === token) setIsReading(false);
    }
  };
  const removeFile = (id: string) => {
    cancelReading();
    const snapshot = getSnapshot();
    const files = snapshot.files.filter((file) => file.id !== id);
    changeFiles(
      files,
      snapshot.originalId === id ? (files[0]?.id ?? null) : snapshot.originalId,
    );
  };
  return {
    isReading,
    readingLabel,
    cancelReading,
    addSelectedFiles,
    addFolder,
    removeFile,
  };
}
