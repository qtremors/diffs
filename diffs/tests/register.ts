import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const sourceRoot = path.resolve(import.meta.dirname, "../src");
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier.startsWith("@/")
        ? pathToFileURL(path.join(sourceRoot, `${specifier.slice(2)}.ts`)).href
        : specifier,
      context,
    );
  },
});
