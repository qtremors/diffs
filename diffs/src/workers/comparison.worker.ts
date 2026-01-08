import { computeTextComparison, createPatch } from "@/lib/comparison/text";
import type { WorkerTask } from "@/lib/types";
self.onmessage = (event: MessageEvent<WorkerTask>) => {
  const task = event.data;
  try {
    let result;
    switch (task.kind) {
case "text": result = computeTextComparison(task.oldText, task.newText, task.options); break;
case "patch": result = createPatch(task.oldText, task.newText, task.originalName, task.modifiedName); break;
      default: throw new Error("Choose a supported comparison format.");
    }
    self.postMessage({result});
  } catch (error) { self.postMessage({error: error instanceof Error ? error.message : "Could not compare."}); }
};
