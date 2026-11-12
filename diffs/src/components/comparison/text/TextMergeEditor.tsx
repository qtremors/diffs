"use client";
import { useEffect, useRef, useImperativeHandle } from "react";
import {
  Compartment,
  EditorState,
  Transaction,
  StateEffect,
  StateField,
  type Extension,
} from "@codemirror/state";
import {
  EditorView,
  lineNumbers,
  drawSelection,
  highlightSpecialChars,
  keymap,
  placeholder,
  Decoration,
  type DecorationSet,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyField,
  historyKeymap,
} from "@codemirror/commands";
import { MergeView } from "@codemirror/merge";
import { editorDiff } from "@/lib/comparison/editor";
import { validateText } from "@/lib/comparison/text";
import type { Ref } from "react";
import type { TextMatch, TextSide } from "@/lib/comparison/review";

const setSearchMarks = StateEffect.define<DecorationSet>();
const searchMarks = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (value, transaction) => {
    value = value.map(transaction.changes);
    for (const effect of transaction.effects) if (effect.is(setSearchMarks)) value = effect.value;
    return value;
  },
  provide: (field) => EditorView.decorations.from(field),
});

export interface TextMergeEditorHandle {
  revealChange: (original: number, modified: number) => void;
  revealMatch: (side: TextSide, match: TextMatch) => void;
}
interface Props {
  oldText: string;
  newText: string;
  onOldTextChange: (text: string) => void;
  onNewTextChange: (text: string) => void;
  ignoreWhitespace: boolean;
  wrap: boolean;
  onlyChanges: boolean;
  onLimit: (message: string) => void;
  search?: { side: TextSide; matches: readonly TextMatch[]; selected: number };
  ref?: Ref<TextMergeEditorHandle>;
}
const theme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--editor-background)",
      color: "var(--text)",
      fontSize: "13px",
    },
    ".cm-content": { padding: "12px 0", caretColor: "var(--focus)" },
    ".cm-line": { padding: "0 12px", lineHeight: "24px" },
    ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "24px" },
    ".cm-gutters": {
      backgroundColor: "var(--editor-gutter)",
      color: "var(--subtle)",
      borderRight: "1px solid var(--border-subtle)",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      minWidth: "32px",
      padding: "0 7px 0 4px",
    },
    ".cm-cursor": { borderLeftColor: "var(--focus)", borderLeftWidth: "2px" },
    "&.cm-focused .cm-selectionBackground,.cm-selectionBackground,::selection":
      { backgroundColor: "var(--selection)" },
    ".cm-placeholder": { color: "var(--subtle)" },
    "&.cm-focused": {
      outline: "2px solid var(--focus)",
      outlineOffset: "-2px",
    },
  },
  { dark: true },
);

/** The DOM editors own cursor/history; React owns the source strings and options. */
export default function TextMergeEditor({ ref: editorRef, ...props }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const merge = useRef<MergeView | null>(null);
  const latest = useRef(props);
  const saved = useRef<{
    a: EditorState;
    b: EditorState;
    top: number;
    scrollA: { top: number; left: number };
    scrollB: { top: number; left: number };
    focus: "a" | "b" | null;
  } | null>(null);
  const compartments = useRef<{ a: Compartment; b: Compartment } | null>(null);
  const syncing = useRef(false);
  useEffect(() => {
    latest.current = props;
  });
  useImperativeHandle(
    editorRef,
    () => ({
      revealChange: (original, modified) => {
        const view = merge.current;
        if (!view) return;
        for (const [editor, position] of [[view.a, original], [view.b, modified]] as const) {
          const anchor = Math.min(position, editor.state.doc.length);
          editor.dispatch({ selection: { anchor }, effects: EditorView.scrollIntoView(anchor, { y: "center" }),
            annotations: Transaction.addToHistory.of(false) });
        }
      },
      revealMatch: (side, match) => {
        const editor = side === "original" ? merge.current?.a : merge.current?.b;
        if (!editor || match.to > editor.state.doc.length) return;
        editor.dispatch({ selection: { anchor: match.from, head: match.to },
          effects: EditorView.scrollIntoView(match.from, { y: "center" }),
          annotations: Transaction.addToHistory.of(false) });
      },
    }),
    [],
  );
  const ignoreWhitespace = props.ignoreWhitespace;
  useEffect(() => {
    if (!host.current) return;
    const current = latest.current;
    const previous = saved.current;
    const wrapA = new Compartment(),
      wrapB = new Compartment();
    compartments.current = { a: wrapA, b: wrapB };
    const extensions = (side: "a" | "b"): Extension[] => [
      theme,
      lineNumbers(),
      drawSelection(),
      highlightSpecialChars(),
      history(),
      searchMarks,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorState.lineSeparator.of("\n"),
      (side === "a" ? wrapA : wrapB).of(
        current.wrap ? EditorView.lineWrapping : [],
      ),
      placeholder(`Paste ${side === "a" ? "original" : "modified"} text here…`),
      EditorView.contentAttributes.of({
        "aria-label": side === "a" ? "Original" : "Modified",
        "aria-multiline": "true",
        spellcheck: "false",
        autocapitalize: "off",
        autocorrect: "off",
      }),
      EditorState.transactionFilter.of((transaction) => {
        if (transaction.docChanged) {
          try {
            validateText(transaction.newDoc.toString());
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "This edit exceeds the text limit.";
            queueMicrotask(() =>
              latest.current.onLimit(`${message} That edit was not inserted.`),
            );
            return [];
          }
        }
        return transaction;
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !syncing.current)
          (side === "a"
            ? latest.current.onOldTextChange
            : latest.current.onNewTextChange)(update.state.doc.toString());
      }),
      ...(previous
        ? [historyField.init(() => previous[side].field(historyField))]
        : []),
    ];
    const view = new MergeView({
      parent: host.current,
      a: {
        doc: current.oldText,
        selection: previous?.a.selection,
        extensions: extensions("a"),
      },
      b: {
        doc: current.newText,
        selection: previous?.b.selection,
        extensions: extensions("b"),
      },
      gutter: true,
      highlightChanges: true,
      collapseUnchanged: current.onlyChanges
        ? { margin: 3, minSize: 8 }
        : undefined,
      diffConfig: { override: (a, b) => editorDiff(a, b, ignoreWhitespace) },
    });
    const mobileHeading = (side: "a" | "b", label: string) => {
      const heading = document.createElement("div");
      heading.className = `editor-mobile-heading ${side === "a" ? "diff-removed" : "diff-added"}`;
      heading.textContent = label;
      view[side].dom.parentElement?.prepend(heading);
    };
    mobileHeading("a", "− Original");
    mobileHeading("b", "+ Modified");
    const linkScroll = (side: "a" | "b") => {
      if (!window.matchMedia("(max-width: 600px)").matches) return;
      const source = view[side].scrollDOM;
      const target = view[side === "a" ? "b" : "a"].scrollDOM;
      if (Math.abs(target.scrollTop - source.scrollTop) > 1)
        target.scrollTop = source.scrollTop;
    };
    const scrollA = () => linkScroll("a"),
      scrollB = () => linkScroll("b");
    view.a.scrollDOM.addEventListener("scroll", scrollA);
    view.b.scrollDOM.addEventListener("scroll", scrollB);
    merge.current = view;
    if (previous) {
      view.dom.scrollTop = previous.top;
      view.a.scrollDOM.scrollTop = previous.scrollA.top;
      view.a.scrollDOM.scrollLeft = previous.scrollA.left;
      view.b.scrollDOM.scrollTop = previous.scrollB.top;
      view.b.scrollDOM.scrollLeft = previous.scrollB.left;
      if (previous.focus) view[previous.focus].focus();
    }
    return () => {
      saved.current = {
        a: view.a.state,
        b: view.b.state,
        top: view.dom.scrollTop,
        scrollA: {
          top: view.a.scrollDOM.scrollTop,
          left: view.a.scrollDOM.scrollLeft,
        },
        scrollB: {
          top: view.b.scrollDOM.scrollTop,
          left: view.b.scrollDOM.scrollLeft,
        },
        focus: view.a.hasFocus ? "a" : view.b.hasFocus ? "b" : null,
      };
      merge.current = null;
      view.a.scrollDOM.removeEventListener("scroll", scrollA);
      view.b.scrollDOM.removeEventListener("scroll", scrollB);
      view.destroy();
      view.dom.remove();
    };
  }, [ignoreWhitespace]);
  useEffect(() => {
    const view = merge.current;
    if (!view) return;
    syncing.current = true;
    try {
      for (const [editor, value] of [
        [view.a, props.oldText],
        [view.b, props.newText],
      ] as const) {
        if (editor.state.doc.toString() !== value)
          editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: value },
            selection: {
              anchor: Math.min(editor.state.selection.main.head, value.length),
            },
            annotations: Transaction.addToHistory.of(false),
          });
      }
    } finally {
      syncing.current = false;
    }
  }, [props.oldText, props.newText]);
  useEffect(() => {
    const view = merge.current,
      wrap = compartments.current;
    if (!view || !wrap) return;
    view.a.dispatch({
      effects: wrap.a.reconfigure(props.wrap ? EditorView.lineWrapping : []),
    });
    view.b.dispatch({
      effects: wrap.b.reconfigure(props.wrap ? EditorView.lineWrapping : []),
    });
    view.reconfigure({
      collapseUnchanged: props.onlyChanges
        ? { margin: 3, minSize: 8 }
        : undefined,
    });
  }, [props.wrap, props.onlyChanges]);
  useEffect(() => {
    const view = merge.current;
    if (!view) return;
    for (const [editor, side] of [[view.a, "original"], [view.b, "modified"]] as const) {
      const matches = props.search?.side === side ? props.search.matches : [];
      const marks = matches.map((match, index) => Decoration.mark({
        class: index === props.search?.selected ? "search-match search-match-current" : "search-match",
      }).range(match.from, match.to));
      editor.dispatch({ effects: setSearchMarks.of(Decoration.set(marks)) });
    }
  }, [props.search, ignoreWhitespace]);
  return <div ref={host} className="editable-diff" />;
}
