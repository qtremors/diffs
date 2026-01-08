import type { WorkerTask, WorkerResult } from "@/lib/types";

export function runWorker<T extends WorkerTask>(
  task: T,
  signal?: AbortSignal,
): Promise<WorkerResult<T>> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    const worker = new Worker(
      new URL("../../workers/comparison.worker.ts", import.meta.url),
      { type: "module" },
    );
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      finish();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      finish();
      reject(new Error("This comparison took too long. Try smaller files."));
    }, 15_000);
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event) => {
      finish();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.result as WorkerResult<T>);
    };
    worker.onerror = () => {
      finish();
      reject(
        new Error(
          "The comparison could not start. Reload and try again in a current browser.",
        ),
      );
    };
    worker.onmessageerror = () => {
      finish();
      reject(
        new Error(
          "The comparison result could not be read. Try smaller inputs.",
        ),
      );
    };
    try {
      worker.postMessage(task);
    } catch (error) {
      finish();
      reject(error);
    }
  });
}
