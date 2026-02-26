"use client";

// ---------------------------------------------------------------------------
// TextInputPanel — direct text paste for quick comparisons
// ---------------------------------------------------------------------------

import React from "react";
import { FileText } from "lucide-react";

interface TextInputPanelProps {
  oldText: string;
  newText: string;
  onOldTextChange: (text: string) => void;
  onNewTextChange: (text: string) => void;
}

export default function TextInputPanel({
  oldText,
  newText,
  onOldTextChange,
  onNewTextChange,
}: TextInputPanelProps) {
  return (
    <div className="text-input-grid">
      <div className="text-input-col">
        <label className="text-input-label">
          <FileText size={14} className="text-input-icon text-input-icon-original" />
          Original Text
        </label>
        <textarea
          className="text-input-area"
          value={oldText}
          onChange={(e) => onOldTextChange(e.target.value)}
          placeholder="Paste original text here..."
          spellCheck={false}
        />
      </div>
      <div className="text-input-col">
        <label className="text-input-label">
          <FileText size={14} className="text-input-icon text-input-icon-modified" />
          Modified Text
        </label>
        <textarea
          className="text-input-area"
          value={newText}
          onChange={(e) => onNewTextChange(e.target.value)}
          placeholder="Paste modified text here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
