// ---------------------------------------------------------------------------
// useFileUpload — drag-and-drop + file input handling
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef } from "react";
import type { ComparisonFile, FileType } from "@/lib/types";
import { detectFileType, readFileAsText, readFileAsDataUrl, generateId } from "@/lib/utils/file";

export function useFileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const processFile = useCallback(async (file: File): Promise<ComparisonFile> => {
    const type: FileType = detectFileType(file);

    const compFile: ComparisonFile = {
      id: generateId(),
      name: file.name,
      type,
      size: file.size,
      mimeType: file.type,
    };

    if (type === "text") {
      compFile.textContent = await readFileAsText(file);
    } else if (type === "image") {
      compFile.dataUrl = await readFileAsDataUrl(file);
    } else {
      // Attempt text read for unknown files
      try {
        compFile.textContent = await readFileAsText(file);
        compFile.type = "text";
      } catch {
        // Leave as unknown
      }
    }

    return compFile;
  }, []);

  const processFiles = useCallback(
    async (files: FileList | File[]): Promise<ComparisonFile[]> => {
      const fileArray = Array.from(files);
      return Promise.all(fileArray.map(processFile));
    },
    [processFile]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent): Promise<ComparisonFile[]> => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length === 0) return [];
      return processFiles(files);
    },
    [processFiles]
  );

  return {
    isDragging,
    processFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
