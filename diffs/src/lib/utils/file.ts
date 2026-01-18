export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("This file could not be read. Try selecting it again."));
    reader.onabort = () => reject(new Error("File reading was cancelled."));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function downloadFile(
  content: Blob | string,
  name: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(
    typeof content === "string" ? new Blob([content], { type }) : content,
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
