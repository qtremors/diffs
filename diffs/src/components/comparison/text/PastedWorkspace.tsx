"use client";
import type { SessionData } from "@/lib/types";
import TextInputPanel from "./TextInputPanel";
import PastedComparison from "../data/PastedComparison";
interface Props {
  oldText: string;
  newText: string;
  onOldTextChange: (text: string) => void;
  onNewTextChange: (text: string) => void;
  format: SessionData["pasteFormat"];
  onFormat: (format: SessionData["pasteFormat"]) => void;
}
export default function PastedWorkspace({
  format = "text",
  onFormat,
  ...text
}: Props) {
  return (
    <>
      <div className="comparison-format pasted-format">
        <label className="field-label">
          Compare text as
          <select
            aria-label="Compare text as"
            value={format}
            onChange={(e) =>
              onFormat(e.target.value as SessionData["pasteFormat"])
            }
          >
            <option value="text">Source text</option>
            <option value="json">JSON fields</option>
            <option value="table">Table records</option>
          </select>
        </label>
      </div>
      <TextInputPanel {...text} />
      {format !== "text" && (
        <div className="structured-text-result">
          <PastedComparison
            oldText={text.oldText}
            newText={text.newText}
            format={format}
          />
        </div>
      )}
    </>
  );
}
