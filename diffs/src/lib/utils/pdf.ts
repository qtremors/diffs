import { MAX_PDF_PAGES, MAX_TEXT_LENGTH } from "@/lib/constants";
import { validateText } from "@/lib/comparison/text";

export async function extractPdf(
  bytes: Uint8Array,
  signal?: AbortSignal,
  progress?: (message: string) => void,
): Promise<string[]> {
  signal?.throwIfAborted();
  const { getDocument, PDFWorker } = await import("pdfjs-dist");
  signal?.throwIfAborted();
  const port = new Worker(
    new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
    { type: "module" },
  );
  const worker = PDFWorker.create({ port });
  const task = getDocument({
    data: bytes.slice(),
    worker,
    cMapUrl: `${location.origin}/pdf-assets/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${location.origin}/pdf-assets/standard_fonts/`,
    wasmUrl: `${location.origin}/pdf-assets/wasm/`,
    enableXfa: false,
    useWorkerFetch: true,
    verbosity: 0,
  });
  let interrupted = false;
  let rejectInterrupted: (reason: Error) => void;
  const interruption = new Promise<never>((_, reject) => {
    rejectInterrupted = reject;
  });
  const stop = (reason: Error) => {
    interrupted = true;
    rejectInterrupted(reason);
    // PDF.js may await a worker reply during destroy. Do not await it after termination.
    void task.destroy().catch(() => {});
    worker.destroy();
    port.terminate();
  };
  const abort = () => stop(new DOMException("Cancelled", "AbortError"));
  const workerError = () =>
    stop(new Error("The PDF reader could not start. Reload and try again."));
  const timer = setTimeout(
    () => stop(new Error("PDF reading took too long. Try a smaller document.")),
    30_000,
  );
  signal?.addEventListener("abort", abort, { once: true });
  port.addEventListener("error", workerError);
  task.onPassword = () =>
    stop(
      new Error(
        "Password-protected PDFs are not supported. Save an unlocked copy first.",
      ),
    );
  const extract = async () => {
    const document = await task.promise;
    if (document.numPages > MAX_PDF_PAGES)
      throw new Error(
        "PDFs support up to 100 pages. Split the document first.",
      );
    const pages: string[] = [];
    let length = 0;
    for (let i = 1; i <= document.numPages; i++) {
      signal?.throwIfAborted();
      if (interrupted) throw new DOMException("Cancelled", "AbortError");
      progress?.(`Reading page ${i} of ${document.numPages}`);
      const page = await document.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) =>
          "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
        )
        .join("")
        .trimEnd();
      length += text.length;
      if (length > MAX_TEXT_LENGTH)
        throw new Error(
          "PDFs support up to 500,000 extracted characters. Split the document first.",
        );
      validateText(text);
      pages.push(text);
      page.cleanup();
    }
    return pages;
  };
  try {
    return await Promise.race([extract(), interruption]);
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (
      interrupted ||
      (error instanceof Error && /support up to/.test(error.message))
    )
      throw error;
    throw new Error(
      "This PDF could not be read. It may be damaged or password-protected.",
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    port.removeEventListener("error", workerError);
    if (!interrupted) await task.destroy().catch(() => {});
    worker.destroy();
    port.terminate();
  }
}
