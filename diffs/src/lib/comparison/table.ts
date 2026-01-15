import type {
  TableOptions,
  TableComparisonResult,
  TableRow,
} from "@/lib/types";
import {
  MAX_TABLE_ROWS,
  MAX_TABLE_COLUMNS,
  MAX_TABLE_CELLS,
} from "@/lib/constants";
import { validateText } from "@/lib/comparison/text";

export function parseDelimited(source: string, delimiter: string): string[][] {
  validateText(source);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let closed = false;
  let touched = false;
  let line = 1;
  let cells = 0;
  const fail = (message: string): never => {
    throw new Error(`${message} near line ${line}.`);
  };
  const cell = () => {
    row.push(field);
    field = "";
    closed = false;
    if (row.length > MAX_TABLE_COLUMNS || ++cells > MAX_TABLE_CELLS)
      fail("Table exceeds 200 columns or 100,000 cells");
  };
  const record = () => {
    if (touched || row.length || field.length) {
      cell();
      rows.push(row);
      if (rows.length > MAX_TABLE_ROWS + 1)
        fail("Table exceeds 5,000 data rows");
    }
    row = [];
    touched = false;
    closed = false;
  };
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else {
        field += char;
        if (char === "\n" || (char === "\r" && source[i + 1] !== "\n")) line++;
      }
      continue;
    }
    if (char === delimiter) {
      cell();
      touched = true;
    } else if (char === "\n" || char === "\r") {
      record();
      if (char === "\r" && source[i + 1] === "\n") i++;
      line++;
    } else if (char === '"' && !field && !closed) {
      quoted = true;
      touched = true;
    } else {
      if (closed || char === '"')
        fail("Unexpected content outside a quoted cell");
      field += char;
      touched = true;
    }
  }
  if (quoted) fail("Unclosed quoted cell");
  record();
  return rows;
}

export function detectDelimiter(source: string, name = ""): string {
  if (/\.tsv$/i.test(name)) return "\t";
  let best = ",";
  let score = 0;
  for (const delimiter of [",", "\t", ";", "|"]) {
    try {
      const rows = parseDelimited(source, delimiter);
      const width = rows[0]?.length ?? 0;
      if (
        width > 1 &&
        rows.slice(0, 10).every((row) => row.length === width) &&
        width > score
      ) {
        best = delimiter;
        score = width;
      }
    } catch {
      /* Another delimiter may be valid. The selected parse still reports errors. */
    }
  }
  return best;
}

export function compareTables(
  oldText: string,
  newText: string,
  options: TableOptions,
  originalName = "",
  modifiedName = "",
): TableComparisonResult {
  const prepare = (source: string, name: string, side: string) => {
    const delimiter =
      options.delimiter === "auto"
        ? detectDelimiter(source, name)
        : options.delimiter;
    let parsed: string[][];
    try {
      parsed = parseDelimited(source, delimiter);
    } catch (error) {
      throw new Error(`${side}: ${(error as Error).message}`);
    }
    const columns = options.headers
      ? (parsed.shift() ?? [])
      : Array.from(
          { length: parsed[0]?.length ?? 0 },
          (_, i) => `Column ${i + 1}`,
        );
    if (
      columns.some((column) => !column.length) ||
      new Set(columns).size !== columns.length
    )
      throw new Error(
        `${side}: column headings must be nonempty and unique. Turn off First row is headings to compare by position.`,
      );
    if (parsed.length > MAX_TABLE_ROWS)
      throw new Error(`${side}: tables support up to 5,000 data rows.`);
    for (let i = 0; i < parsed.length; i++)
      if (parsed[i].length !== columns.length)
        throw new Error(
          `${side}: record ${i + 1} has ${parsed[i].length} cells; expected ${columns.length}. Check the separator.`,
        );
    const keys = new Set<string>();
    const keyIndex = options.keyColumn
      ? columns.indexOf(options.keyColumn)
      : -1;
    if (options.keyColumn && keyIndex < 0)
      throw new Error(
        `${side}: the key column ${JSON.stringify(options.keyColumn)} is missing.`,
      );
    const records = new Map<
      string,
      { row: Record<string, string>; index: number }
    >();
    parsed.forEach((cells, i) => {
      const key = keyIndex < 0 ? String(i + 1) : cells[keyIndex];
      if (!key.length || keys.has(key))
        throw new Error(
          `${side}: row keys must be nonempty and unique. Use Row order or choose another column.`,
        );
      keys.add(key);
      records.set(key, {
        row: Object.assign(
          Object.create(null),
          Object.fromEntries(columns.map((column, j) => [column, cells[j]])),
        ),
        index: i + 1,
      });
    });
    return { delimiter, columns, records };
  };
  const a = prepare(oldText, originalName, "Original");
  const b = prepare(newText, modifiedName, "Modified");
  const columns = [...new Set([...a.columns, ...b.columns])];
  const rows: TableRow[] = [];
  for (const key of new Set([...a.records.keys(), ...b.records.keys()])) {
    const left = a.records.get(key);
    const right = b.records.get(key);
    const changedColumns = columns.filter(
      (column) => left?.row[column] !== right?.row[column],
    );
    rows.push({
      key,
      kind: !left
        ? "added"
        : !right
          ? "removed"
          : changedColumns.length
            ? "changed"
            : "same",
      originalRow: left?.index ?? null,
      modifiedRow: right?.index ?? null,
      before: left?.row ?? null,
      after: right?.row ?? null,
      changedColumns,
    });
  }
  const counts = { added: 0, removed: 0, changed: 0, same: 0 };
  rows.forEach((row) => counts[row.kind]++);
  return {
    type: "table",
    columns,
    originalColumns: a.columns,
    modifiedColumns: b.columns,
    rows,
    ...counts,
    equivalent:
      !counts.added &&
      !counts.removed &&
      !counts.changed &&
      a.columns.length === b.columns.length &&
      a.columns.every((column) => b.columns.includes(column)),
    originalDelimiter: a.delimiter,
    modifiedDelimiter: b.delimiter,
    options,
  };
}
