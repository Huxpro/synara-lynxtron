import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import { parseMarkdown } from "./markdownAst.lynx";
import {
  collapseMarkdownSoftBreaks,
  isMarkdownListLoose,
  markdownSpacingStyle,
  resolveMarkdownChildSpacing,
  resolveMarkdownCodeBlockPresentation,
  resolveMarkdownCodeHighlightPath,
  resolveMarkdownTableColumnWeights,
  resolveMarkdownInlineTokenPresentation,
  resolveMarkdownListMarker,
  toggleMarkdownCodeWrap,
} from "./markdownPresentation.logic";

describe("Lynx markdown presentation logic", () => {
  it("dedents fenced code and keeps language outside the body", () => {
    expect(
      resolveMarkdownCodeBlockPresentation({
        code: '    function greet() {\n      return "hello";\n    }',
        language: "javascript",
      }),
    ).toEqual({
      code: 'function greet() {\n  return "hello";\n}\n',
      displayCode: 'function greet() {\n  return "hello";\n}',
      directory: null,
      filePath: null,
      highlightPath: "snippet.js",
      isFileReference: false,
      lineCount: 3,
      lineRange: null,
      title: "javascript",
    });
  });

  it("projects file-reference metadata with the Web code-fence grammar", () => {
    expect(
      resolveMarkdownCodeBlockPresentation({
        code: "const ready = true;",
        language: "12:18:src/runtime/state.ts",
      }),
    ).toEqual({
      code: "const ready = true;\n",
      displayCode: "const ready = true;",
      directory: "src/runtime",
      filePath: "src/runtime/state.ts",
      highlightPath: "src/runtime/state.ts",
      isFileReference: true,
      lineCount: 1,
      lineRange: "12-18",
      title: "state.ts",
    });
    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./markdown.css", import.meta.url), "utf8");
    expect(source).toContain('className="MdCodeFileIcon"');
    expect(source).toContain('<text className="MdCodeDirectory">{presentation.directory}</text>');
    expect(source).toContain('<text className="MdCodeLineRange">{presentation.lineRange}</text>');
    expect(styles).toMatch(/\.MdCodeFileIcon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s);
    expect(styles).toMatch(
      /\.MdCodeDirectory\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
    );
  });

  it("uses the same readable labels for skills, mentions, and links", () => {
    expect(
      resolveMarkdownInlineTokenPresentation({
        type: "skill",
        name: "check-code",
      }),
    ).toEqual({ label: "Check Code", openExternalUrl: null });
    expect(
      resolveMarkdownInlineTokenPresentation({
        type: "mention",
        path: "src/components/App.tsx",
      }),
    ).toEqual({ label: "App.tsx", openExternalUrl: null });
    expect(
      resolveMarkdownInlineTokenPresentation({
        type: "link",
        url: "https://example.com",
      }),
    ).toEqual({
      label: "https://example.com",
      openExternalUrl: "https://example.com",
    });
  });

  it("keeps soft-wrap state deterministic and wires both accessible actions", () => {
    expect(toggleMarkdownCodeWrap(false)).toBe(true);
    expect(toggleMarkdownCodeWrap(true)).toBe(false);

    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain('label={wrap ? "Disable soft wrap" : "Enable soft wrap"}');
    expect(source).toContain('label={copied ? "Copied" : "Copy code"}');
    expect(source).toContain('variant === "user" ? " MdRoot--user" : ""');
    expect(source).toContain("resolveLynxMarkdownFileReference({");
    expect(source).toContain("resolveLynxInlineCodeFileReference({");
    expect(source).toContain("<MarkdownFileReferenceToken");
    expect(source).toContain("onOpenFileReference={context.onOpenFileReference}");
    expect(source).toContain('renderUserText(text, "fallback", context)');
    expect(source).toContain('accessibility-role="checkbox"');
    expect(source).toContain("accessibility-state={{ checked: props.checked, disabled: true }}");
    expect(source).toContain('className="MdTaskCheckboxIcon"');
    expect(source).not.toContain("'☑'");
    expect(source).not.toContain("'☐'");
    const styles = readFileSync(new URL("./markdown.css", import.meta.url), "utf8");
    // A disabled native checkbox: 0.95em square, muted rather than primary.
    expect(styles).toMatch(
      /\.MdTaskCheckbox\s*\{[^}]*width:\s*0\.95em;[^}]*height:\s*0\.95em;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--muted-foreground\);[^}]*border-radius:\s*3px;/s,
    );
    expect(styles).toMatch(
      /\.MdTaskCheckbox--checked\s*\{[^}]*background-color:\s*var\(--muted-foreground\);/s,
    );
  });

  it("keeps user dollar tokens out of the assistant math processor", () => {
    const source = readFileSync(new URL("./markdownAst.lynx.ts", import.meta.url), "utf8");
    expect(source).toContain('variant === "user" ? userProcessor : assistantProcessor');
    expect(source).toMatch(
      /const userProcessor = unified\(\)\s*\.use\(remarkParse\)\s*\.use\(remarkGfm\);/s,
    );
  });
});

describe("markdown list markers", () => {
  it("follows Electron's nested ordered styles and honors the list start", () => {
    expect(resolveMarkdownListMarker({ ordered: true, index: 39, depth: 0 })).toBe("40.");
    expect(resolveMarkdownListMarker({ ordered: true, index: 0, start: 7, depth: 0 })).toBe("7.");
    expect(resolveMarkdownListMarker({ ordered: true, index: 26, depth: 1 })).toBe("aa.");
    expect(resolveMarkdownListMarker({ ordered: true, index: 3, depth: 2 })).toBe("iv.");
  });

  it("cycles disc, circle and square for nested unordered lists", () => {
    expect(
      [0, 1, 2, 3].map((depth) => resolveMarkdownListMarker({ ordered: false, index: 0, depth })),
    ).toEqual(["•", "◦", "▪", "▪"]);
  });

  it("treats a list as loose when it or any item is spread", () => {
    expect(isMarkdownListLoose({ spread: false, children: [{ spread: false }] })).toBe(false);
    expect(isMarkdownListLoose({ spread: false, children: [{ spread: true }] })).toBe(true);
    expect(isMarkdownListLoose({ spread: true })).toBe(true);
  });
});

describe("markdown code highlighting path", () => {
  it("maps fence language names to the extension the host highlighter keys on", () => {
    expect(resolveMarkdownCodeHighlightPath("python")).toBe("snippet.py");
    expect(resolveMarkdownCodeHighlightPath("bash")).toBe("snippet.sh");
    expect(resolveMarkdownCodeHighlightPath("TypeScript")).toBe("snippet.ts");
    expect(resolveMarkdownCodeHighlightPath("json")).toBe("snippet.json");
    expect(resolveMarkdownCodeHighlightPath("diff")).toBe("snippet.diff");
  });

  it("leaves plain fences unhighlighted", () => {
    expect(resolveMarkdownCodeHighlightPath(null)).toBeNull();
    expect(resolveMarkdownCodeHighlightPath("text")).toBeNull();
    expect(resolveMarkdownCodeHighlightPath("")).toBeNull();
  });
});

describe("markdown parsing parity with the Web plugin list", () => {
  it("turns an inline <br> into a break and drops a block-level one", () => {
    const tree = parseMarkdown("a hard<br>break.\n\n<br>\n\nnext");
    expect(tree.children?.map((child) => child.type)).toEqual(["paragraph", "paragraph"]);
    expect(tree.children?.[0]?.children?.map((child) => child.type)).toEqual([
      "text",
      "break",
      "text",
    ]);
  });

  it("tags GitHub alerts and strips the marker", () => {
    const tree = parseMarkdown("> [!WARNING]\n> Careful.\n\n> plain quote");
    const [alert, quote] = tree.children ?? [];
    expect(alert?.alert).toBe("warning");
    expect(alert?.children?.[0]?.children?.[0]?.value).toBe("Careful.");
    expect(quote?.alert).toBeUndefined();
  });

  it("keeps table column alignment", () => {
    const tree = parseMarkdown("| a | b | c |\n| :-- | :-: | --: |\n| 1 | 2 | 3 |");
    expect(tree.children?.[0]?.align).toEqual(["left", "center", "right"]);
  });

  it("collapses a soft line break to one space, as a Web paragraph does", () => {
    expect(collapseMarkdownSoftBreaks("first line.  \n  second line")).toBe(
      "first line. second line",
    );
    expect(collapseMarkdownSoftBreaks("no break")).toBe("no break");
  });
});

describe("markdown table column weights", () => {
  it("weights each column by its longest cell with a floor for short ones", () => {
    expect(
      resolveMarkdownTableColumnWeights([
        ["Function", "Parameters", "Returns"],
        ["add", "a: number, b: number", "number"],
        ["x", "y", "z"],
      ]),
    ).toEqual([8, 20, 7]);
    expect(resolveMarkdownTableColumnWeights([["a", "b"]])).toEqual([4, 4]);
  });
});

describe("markdown block spacing (collapsed margins of .chat-markdown)", () => {
  const spacing = (markdown: string, variant: "assistant" | "user" = "assistant") =>
    resolveMarkdownChildSpacing({ parent: parseMarkdown(markdown, variant), variant }).map(
      markdownSpacingStyle,
    );

  it("separates neighbours by one block margin and drops the outer ones", () => {
    expect(spacing("one\n\ntwo\n\n- item")).toEqual([
      { marginTop: "0px", marginBottom: "0px" },
      { marginTop: "10.4px", marginBottom: "0px" },
      { marginTop: "10.4px", marginBottom: "0px" },
    ]);
  });

  it("uses the tighter user-bubble margin but keeps the code block's own", () => {
    expect(spacing("one\n\ntwo\n\n```\ncode\n```", "user").map((s) => s.marginTop)).toEqual([
      "0px",
      "7.2px",
      "10.4px",
    ]);
  });

  it("gives a heading 1.1em of its own size, or 0.5em right under its parent level", () => {
    expect(spacing("text\n\n# One\n\n## Two\n\n#### Four\n\ntext").map((s) => s.marginTop)).toEqual(
      ["0px", "1.1em", "0.5em", "1.1em", "10.4px"],
    );
  });

  it("uses the rule's 1.5rem on both sides", () => {
    expect(spacing("a\n\n---\n\nb").map((s) => s.marginTop)).toEqual(["0px", "24px", "24px"]);
  });

  it("spaces tight items by 0.25rem and lets a nested list's margin pass through its item", () => {
    const list = parseMarkdown("- one\n- two\n  - nested\n- three").children![0]!;
    expect(
      resolveMarkdownChildSpacing({ parent: list, variant: "assistant" }).map(
        (s) => markdownSpacingStyle(s).marginTop,
      ),
    ).toEqual(["0px", "4px", "10.4px"]);
    // Inside the item: text flush, then the nested list one block margin below.
    expect(
      resolveMarkdownChildSpacing({
        parent: list.children![1]!,
        variant: "assistant",
        tight: true,
      }).map((s) => markdownSpacingStyle(s).marginTop),
    ).toEqual(["0px", "10.4px"]);
  });

  it("keeps paragraph margins between the blocks of a loose item", () => {
    const list = parseMarkdown("- one\n\n  more\n\n- two").children![0]!;
    expect(
      resolveMarkdownChildSpacing({ parent: list, variant: "assistant" }).map(
        (s) => markdownSpacingStyle(s).marginTop,
      ),
    ).toEqual(["0px", "10.4px"]);
    expect(
      resolveMarkdownChildSpacing({ parent: list.children![0]!, variant: "assistant" }).map(
        (s) => markdownSpacingStyle(s).marginTop,
      ),
    ).toEqual(["0px", "10.4px"]);
  });

  it("lets a trailing loose list's last margin extend below the root", () => {
    expect(spacing("intro\n\n- one\n\n- two").at(-1)).toEqual({
      marginTop: "10.4px",
      marginBottom: "10.4px",
    });
  });
});
