import { computeTextComparison, createPatch } from "@/lib/comparison/text";
import { computeImageDiff } from "@/lib/comparison/image";
import { compareJson } from "@/lib/comparison/json";
import { compareTables } from "@/lib/comparison/table";
import { compareBytes } from "@/lib/comparison/binary";
import { compareFolders } from "@/lib/comparison/folder";
import { comparePdfPages } from "@/lib/comparison/pdf";
import type { WorkerTask } from "@/lib/types";

self.onmessage = async (event: MessageEvent<WorkerTask>) => {
  const task = event.data;
  try {
    let result;
    switch (task.kind) {
      case "text":
        result = computeTextComparison(
          task.oldText,
          task.newText,
          task.options,
        );
        break;
      case "patch":
        result = createPatch(
          task.oldText,
          task.newText,
          task.originalName,
          task.modifiedName,
        );
        break;
      case "image":
        result = {
          type: "image",
          diff: await computeImageDiff(
            task.original,
            task.modified,
            task.threshold,
          ),
        };
        break;
      case "json":
        result = compareJson(task.oldText, task.newText);
        break;
      case "table":
        result = compareTables(
          task.oldText,
          task.newText,
          task.options,
          task.originalName,
          task.modifiedName,
        );
        break;
      case "bytes":
        result = await compareBytes(task.original, task.modified);
        break;
      case "folder":
        result = compareFolders(task.original, task.modified);
        break;
      case "pdf":
        result = comparePdfPages(task.original, task.modified);
        break;
      default: {
        const unsupported: never = task;
        throw new Error(`Unsupported comparison task: ${String(unsupported)}`);
      }
    }
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error
          ? error.message
          : "Comparison failed. Try selecting the files again.",
    });
  }
};
