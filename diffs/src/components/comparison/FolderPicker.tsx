"use client";
import { useRef } from "react";
import { FolderUp } from "lucide-react";
export default function FolderPicker({
  onSelect,
  disabled,
}: {
  onSelect: (files: FileList) => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        hidden
        type="file"
        multiple
        {...{ webkitdirectory: "" }}
        aria-label="Folder selection"
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files?.length) onSelect(event.target.files);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        className="btn-secondary"
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        <FolderUp size={15} />
        Add folder
      </button>
    </>
  );
}
