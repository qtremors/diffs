import type { JsonComparisonResult, JsonChange } from "@/lib/types";
import { validateText } from "@/lib/comparison/text";

type Node = {
  kind: "object" | "array" | "string" | "number" | "boolean" | "null";
  start: number;
  end: number;
  value?: string | boolean | null;
  children?: Map<string, Node>;
};

/** Preserve numeric literals and reject ambiguous duplicate object keys. */
export function parseJson(source: string): Node {
  validateText(source);
  let position = 0;
  let nodes = 0;
  const fail = (message: string): never => {
    const before = source.slice(0, position);
    const line = before.split("\n").length;
    const column = position - before.lastIndexOf("\n");
    throw new Error(`${message} at line ${line}, column ${column}.`);
  };
  const space = () => {
    while (/[\x20\t\r\n]/.test(source[position] ?? "x")) position++;
  };
  const string = (): string => {
    const start = position++;
    while (position < source.length) {
      const char = source[position++];
      if (char === "\\") {
        position++;
        continue;
      }
      if (char === '"') {
        try {
          return JSON.parse(source.slice(start, position)) as string;
        } catch {
          return fail("Invalid JSON string");
        }
      }
    }
    return fail("Unclosed JSON string");
  };
  const numberValue = (raw: string) => {
    const [mantissa, exponent = "0"] = raw.toLowerCase().split("e");
    if (exponent.length > 1000) return fail("Number exponent is too long");
    const negative = mantissa.startsWith("-");
    const unsigned = negative ? mantissa.slice(1) : mantissa;
    const [whole, fraction = ""] = unsigned.split(".");
    let digits = (whole + fraction).replace(/^0+/, "");
    if (!digits) return "0";
    const zeroes = digits.length - digits.replace(/0+$/, "").length;
    digits = digits.slice(0, digits.length - zeroes);
    return `${negative ? "-" : ""}${digits}e${BigInt(exponent) - BigInt(fraction.length) + BigInt(zeroes)}`;
  };
  const value = (depth: number): Node => {
    space();
    if (depth > 100 || ++nodes > 50_000)
      return fail("JSON exceeds the limit of 100 levels or 50,000 values");
    const start = position;
    const char = source[position];
    if (char === "{" || char === "[") {
      position++;
      space();
      const object = char === "{";
      const close = object ? "}" : "]";
      const children = new Map<string, Node>();
      if (source[position] !== close)
        while (true) {
          let key = String(children.size);
          if (object) {
            if (source[position] !== '"')
              return fail("Expected a quoted field name");
            key = string();
            space();
            if (children.has(key))
              return fail(`Duplicate field ${JSON.stringify(key)}`);
            if (source[position++] !== ":")
              return fail("Expected a colon after the field name");
          }
          children.set(key, value(depth + 1));
          space();
          if (source[position] === close) break;
          if (source[position++] !== ",")
            return fail("Expected a comma or closing bracket");
          space();
        }
      position++;
      return {
        kind: object ? "object" : "array",
        children,
        start,
        end: position,
      };
    }
    if (char === '"') {
      const parsed = string();
      return { kind: "string", value: parsed, start, end: position };
    }
    for (const [literal, parsed] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ] as const) {
      if (source.startsWith(literal, position)) {
        position += literal.length;
        return {
          kind: literal === "null" ? "null" : "boolean",
          value: parsed,
          start,
          end: position,
        };
      }
    }
    const raw = source
      .slice(position)
      .match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)?.[0];
    if (!raw) return fail("Expected a JSON value");
    position += raw.length;
    return { kind: "number", value: numberValue(raw), start, end: position };
  };
  const root = value(0);
  space();
  if (position !== source.length)
    return fail("Unexpected content after the JSON value");
  return root;
}

export function compareJson(
  oldText: string,
  newText: string,
): JsonComparisonResult {
  let left: Node;
  let right: Node;
  try {
    left = parseJson(oldText);
  } catch (error) {
    throw new Error(`Original: ${(error as Error).message}`);
  }
  try {
    right = parseJson(newText);
  } catch (error) {
    throw new Error(`Modified: ${(error as Error).message}`);
  }
  const changes: JsonChange[] = [];
  let outputCharacters = 0;
  const display = (node: Node | undefined, source: string) =>
    node ? { kind: node.kind, raw: source.slice(node.start, node.end) } : null;
  const walk = (a: Node | undefined, b: Node | undefined, path: string) => {
    if (a && b && a.kind === b.kind) {
      if (a.children && b.children) {
        for (const key of new Set([...a.children.keys(), ...b.children.keys()]))
          walk(
            a.children.get(key),
            b.children.get(key),
            `${path}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`,
          );
        return;
      }
      if (a.value === b.value) return;
    }
    if (changes.length >= 20_000)
      throw new Error(
        "More than 20,000 field changes. Use Source text or smaller inputs.",
      );
    const before = display(a, oldText);
    const after = display(b, newText);
    outputCharacters +=
      path.length + (before?.raw.length ?? 0) + (after?.raw.length ?? 0);
    if (outputCharacters > 2_000_000)
      throw new Error(
        "JSON change paths and values exceed the result limit. Use Source text or smaller inputs.",
      );
    changes.push({
      path,
      kind: !a ? "added" : !b ? "removed" : "changed",
      before,
      after,
    });
  };
  walk(left, right, "");
  return {
    type: "json",
    changes,
    equivalent: !changes.length,
    identical: oldText === newText,
    added: changes.filter((c) => c.kind === "added").length,
    removed: changes.filter((c) => c.kind === "removed").length,
    changed: changes.filter((c) => c.kind === "changed").length,
  };
}
