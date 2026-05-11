"use client";
import { useState } from "react";
import type { ComparisonFile } from "@/lib/types";
export default function FileDetails({ files }: { files: ComparisonFile[] }) {
  const [selected, setSelected] = useState("");
  const [expected, setExpected] = useState("");
  const [copied, setCopied] = useState("");
  const file =
    files.find((f) => f.id === selected) ?? files.find((f) => f.hash);
  const valid = /^[a-f0-9]{64}$/i.test(expected.trim());
  if (!file) return null;
  return (
    <details className="file-fingerprints">
      <summary>File fingerprints · SHA-256</summary>
      <p className="data-note">
        Fingerprints use the original file bytes, including metadata and
        encoding. Matching fingerprints indicate identical bytes.
      </p>
      <label className="field-label">
        File
        <select
          value={file.id}
          onChange={(e) => {
            setSelected(e.target.value);
            setExpected("");
            setCopied("");
          }}
        >
          {files
            .filter((f) => f.hash)
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
        </select>
      </label>
      <div className="hash-line">
        <code>{file.hash}</code>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            void navigator.clipboard.writeText(file.hash ?? "").then(
              () => setCopied("Fingerprint copied."),
              () =>
                setCopied(
                  "Copy unavailable. Select the fingerprint to copy it.",
                ),
            );
          }}
        >
          Copy SHA-256
        </button>
      </div>
      <label className="field-label">
        Verify an expected SHA-256
        <input
          spellCheck={false}
          autoComplete="off"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="Paste a 64-character fingerprint"
        />
      </label>
      {expected && (
        <p role="status">
          {!valid
            ? "Enter 64 hexadecimal characters."
            : expected.trim().toLowerCase() === file.hash
              ? "SHA-256 matches."
              : "SHA-256 does not match."}
        </p>
      )}
      {copied && <p role="status">{copied}</p>}
    </details>
  );
}
