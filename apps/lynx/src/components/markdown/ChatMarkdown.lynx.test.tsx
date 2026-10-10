import { describe, expect, it } from "@rstest/core";
import { fireEvent, render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { MarkdownFileReferenceToken } from "./MarkdownFileReferenceToken.lynx";

describe("Lynx markdown file reference token", () => {
  it("preparses every initial transcript markdown surface before rendering list cells", () => {
    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    const querySource = readFileSync(
      new URL("../../app/threadPageProjection.logic.ts", import.meta.url),
      "utf8",
    );
    const transcriptSource = readFileSync(
      new URL("../../app/Transcript.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("readonly preparsedTree?: MarkdownNode | null;");
    expect(source).toContain("if (hasPreparsedTree) return;");
    expect(source).toContain("const tree = hasPreparsedTree ? preparsedTree : parsedTree;");
    expect(querySource).toContain("markdownWorkEntries.map((entry) => [");
    expect(querySource).toContain("parseMarkdown(text, role)");
    expect(querySource).toContain("markdownTree: markdownTreesByMessageId[row.message.id] ?? null");
    expect(source).toContain("setParsedTree(parseMarkdown(text, variant));");
    expect(transcriptSource).toContain("preparsedTree={row.markdownTree}");
    expect(transcriptSource).toContain("row.markdownTreesByMessageId?.[chunk.item.message.id]");
    expect(transcriptSource).toContain("markdownTree={row.markdownTreesByWorkEntryId?.[entry.id]}");
  });

  it("inherits transcript typography instead of overriding the configured chat size", () => {
    const styles = readFileSync(new URL("./markdown.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.MdParagraph\s*\{[^}]*font-size:\s*inherit;[^}]*line-height:\s*inherit;/s,
    );
    expect(styles).toMatch(
      /\.MdRoot--user \.MdParagraph\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*white-space:\s*pre-wrap;[^}]*word-break:\s*break-word;/s,
    );
    const rowStyles = readFileSync(
      new URL("../../adapters/message-row-composition-elements.css", import.meta.url),
      "utf8",
    );
    const appStyles = readFileSync(new URL("../../app/App.css", import.meta.url), "utf8");
    expect(rowStyles).toMatch(
      /\.SharedMessageUserColumn\s*\{[^}]*width:\s*80%;[^}]*min-width:\s*0;[^}]*max-width:\s*80%;/s,
    );
    expect(rowStyles).toMatch(
      /\.SharedMessageUserBubble\s*\{[^}]*width:\s*max-content;[^}]*max-width:\s*100%;[^}]*min-width:\s*0;/s,
    );
    expect(appStyles).toMatch(/\.TranscriptUserText\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s);
    expect(rowStyles).toMatch(
      /\.SharedMessageAssistantRow\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s,
    );
    expect(appStyles).toMatch(
      /\.TranscriptAssistantContent\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s,
    );
    expect(appStyles).toMatch(
      /\.TranscriptAssistantTypography\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.MdListMarkerText\s*\{[^}]*font-size:\s*inherit;[^}]*line-height:\s*inherit;/s,
    );
    expect(styles).toMatch(
      /\.MdBlockquote\s*\{[^}]*border-left-width:\s*2px;[^}]*border-left-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.MdMathBlockShell\s*\{[^}]*border-left-width:\s*3px;[^}]*border-left-style:\s*solid;[^}]*border-left-color:\s*var\(--primary\);/s,
    );
    expect(styles).toMatch(
      /\.MdTaskCheckbox\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--muted-foreground\);[^}]*border-right-color:\s*var\(--muted-foreground\);[^}]*border-bottom-color:\s*var\(--muted-foreground\);[^}]*border-left-color:\s*var\(--muted-foreground\);/s,
    );
    expect(styles).toMatch(
      /\.MdTableHeaderText,\s*\.MdTableCellText\s*\{[^}]*font-size:\s*inherit;[^}]*line-height:\s*inherit;/s,
    );
    expect(styles).toMatch(/\.MdTable\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s);
    expect(styles).toMatch(
      /\.MdTableScroller\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-left-color:\s*var\(--border\);/s,
    );
    expect(styles).not.toMatch(/\.MdTableScroller\s*\{[^}]*border:\s*1px solid var\(--border\);/s);
    expect(styles).toMatch(/\.MdTableHeaderCell,\s*\.MdTableCell\s*\{[^}]*min-width:\s*0;/s);
    expect(styles).toMatch(
      /\.MdTableRow\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(/\.MdTableRow\s*\{[^}]*display:\s*flex;/s);
    expect(styles).toMatch(
      /\.MdTableHeaderCell,\s*\.MdTableCell\s*\{[^}]*width:\s*0;[^}]*min-width:\s*0;[^}]*flex-basis:\s*0;[^}]*border-right-width:\s*1px;[^}]*border-right-style:\s*solid;[^}]*border-right-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.MdTableHeaderText,\s*\.MdTableCellText\s*\{[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere;/s,
    );
    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    expect(source).toMatch(
      /<MarkdownTable\s+context=\{context\}[\s\S]*?nodeKey=\{key\}\s+style=\{style\}\s*\/>/,
    );
    expect(source).not.toContain('<scroll-view className="MdTableScroller"');
    expect(styles).toMatch(
      /\.MdTableHeaderText,\s*\.MdTableCellText\s*\{[^}]*word-break:\s*break-word;/s,
    );
    expect(styles).not.toContain("min-width: 460px");
    expect(styles).not.toContain("width: 153px");
  });

  it("publishes an accessible file-open action", () => {
    const styles = readFileSync(new URL("./markdown.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.MdInlineToken\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--color-border-light, var\(--border\)\);[^}]*border-right-color:\s*var\(--color-border-light, var\(--border\)\);[^}]*border-bottom-color:\s*var\(--color-border-light, var\(--border\)\);[^}]*border-left-color:\s*var\(--color-border-light, var\(--border\)\);/s,
    );
    expect(styles).not.toMatch(
      /\.MdInlineToken\s*\{[^}]*border:\s*1px solid var\(--color-border-light, var\(--border\)\);/s,
    );
    const openedPaths: string[] = [];
    const onOpenFileReference = (relativePath: string) => {
      openedPaths.push(relativePath);
    };
    render(
      <MarkdownFileReferenceToken
        className="MdInlineToken MdInlineToken--file"
        onOpenFileReference={onOpenFileReference}
        relativePath="src/app/router.tsx"
        showGlyph
      >
        the router
      </MarkdownFileReferenceToken>,
    );

    const reference = elementTree.root?.querySelector(".MdInlineToken--file");
    expect(reference?.getAttribute("accessibility-label")).toBe("Open src/app/router.tsx");
    expect(reference?.querySelector(".MdInlineTokenIcon")).not.toBeNull();
    expect(reference?.querySelector(".MdInlineTokenGlyph")).toBeNull();
    fireEvent.tap(reference!);
    expect(openedPaths).toEqual(["src/app/router.tsx"]);
  });

  it("stays non-interactive without an owning opener", () => {
    render(
      <MarkdownFileReferenceToken
        className="MdInlineToken MdInlineToken--file"
        relativePath="README.md"
      >
        README.md
      </MarkdownFileReferenceToken>,
    );

    const reference = elementTree.root?.querySelector(".MdInlineToken--file");
    expect(reference?.getAttribute("accessibility-trait")).toBe("text");
    expect(reference?.getAttribute("focusable")).not.toBe("true");
  });

  it("draws a file reference as upstream's mention chip: file-type icon, link colour, chat size", () => {
    const source = readFileSync(
      new URL("./MarkdownFileReferenceToken.lynx.tsx", import.meta.url),
      "utf8",
    );
    const markdown = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./markdown.css", import.meta.url), "utf8");
    expect(source).toContain(
      '<FileEntryIcon className="MdInlineTokenIcon" pathValue={props.relativePath} />',
    );
    expect(markdown).not.toContain("MdInlineToken--file");
    expect(styles).toMatch(
      /\.MdInlineToken--mention,[^{]*\{[^}]*border-width:\s*0;[^}]*color:\s*var\(--info-foreground\);[^}]*font-size:\s*1em;/s,
    );
  });

  it("draws nested unordered markers as shapes and sizes file chips from their text", () => {
    const styles = readFileSync(new URL("./markdown.css", import.meta.url), "utf8");
    const markdown = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    // `list-style-type: circle` and `square`: Native's glyphs for them are a dot and a faint box.
    expect(markdown).toContain('marker === "◦" || marker === "▪"');
    expect(markdown).toContain(
      '`MdListBullet MdListBullet--${marker === "◦" ? "circle" : "square"}`',
    );
    expect(styles).toMatch(
      /\.MdListBullet--circle\s*\{[^}]*border:\s*1px solid var\(--foreground\);[^}]*border-radius:\s*2\.5px;/s,
    );
    expect(styles).toMatch(
      /\.MdListBullet--square\s*\{[^}]*background-color:\s*var\(--foreground\);/s,
    );
    expect(styles).toMatch(/\.MdListBullet\s*\{[^}]*width:\s*4px;[^}]*height:\s*4px;/s);
    // Mention and file chips take the surrounding text's size; `inherit` left them at 11px.
    const chip = /\.MdInlineToken--mention,[^{]*\{([^}]*)\}/s.exec(styles)?.[1] ?? "";
    expect(chip).toMatch(/font-size:\s*1em;/);
    expect(chip).not.toMatch(/font-size:\s*inherit/);
  });

  it("applies resolved block spacing instead of stylesheet margins", () => {
    const styles = readFileSync(new URL("./markdown.css", import.meta.url), "utf8");
    const markdown = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    for (const block of ["MdParagraph", "MdList", "MdBlockquote", "MdCodeBlockShell", "MdRule"]) {
      expect(styles).not.toMatch(new RegExp(`\\.${block}\\s*\\{[^}]*margin-(top|bottom)`, "s"));
    }
    expect(markdown).toContain("resolveMarkdownChildSpacing({");
    // Heading sizes follow the chat font, as `.chat-markdown h1 { font-size: 1.75em }`.
    expect(styles).toMatch(/\.MdH1\s*\{[^}]*font-size:\s*1\.75em;/s);
    expect(styles).toMatch(/\.MdStrong\s*\{[^}]*font-weight:\s*500;/s);
    expect(styles).toMatch(
      /\.MdCodeBlockText\s*\{[^}]*line-height:\s*calc\(var\(--app-font-size-chat, 13px\) \* 1\.625\);/s,
    );
  });

  it("keeps code indentation and hard breaks on Lynx for Web", () => {
    const host = readFileSync(new URL("../../main/web/web-host.ts", import.meta.url), "utf8");
    expect(host).toContain(".MdCodeBlockText raw-text { white-space-collapse: preserve; }");
    expect(host).toContain(".MdBreak { white-space-collapse: preserve-breaks; }");
  });

  it("skips composer token parsing for ordinary user text", () => {
    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("if (!/[@$/]|https?:\\/\\//i.test(value))");
  });

  it("wires external links to the shared favicon slot instead of a text arrow", () => {
    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("{external ? <ExternalLinkIcon url={url} /> : null}");
    expect(source).not.toContain('{external ? <text className="MdLinkTarget"> ↗</text> : null}');
  });

  it("reuses the native host syntax-highlighting contract for fenced code", () => {
    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");

    expect(source).toContain(
      'import { highlightExplorerCode } from "../../data/hostSyntaxHighlight.lynx"',
    );
    expect(source).toContain(
      "const [highlighted, setHighlighted] = useState<NativeSyntaxHighlightResult | null>(null)",
    );
    expect(source).toContain("highlightExplorerCode({ code: presentation.displayCode, path })");
    expect(source).toContain("color: token.color");
  });
});
