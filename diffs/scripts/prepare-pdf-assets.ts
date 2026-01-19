import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
for (const directory of ["cmaps", "standard_fonts", "wasm"]) {
  const destination = new URL(`public/pdf-assets/${directory}/`, root);
  await mkdir(destination, { recursive: true });
  await cp(
    fileURLToPath(new URL(`node_modules/pdfjs-dist/${directory}/`, root)),
    fileURLToPath(destination),
    { recursive: true },
  );
}
await cp(
  new URL("node_modules/pdfjs-dist/LICENSE", root),
  new URL("public/pdf-assets/LICENSE", root),
);
console.log("Local PDF assets ready.");
