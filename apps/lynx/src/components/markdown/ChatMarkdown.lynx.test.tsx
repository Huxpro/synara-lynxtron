import { describe, expect, it } from "@rstest/core";
import { fireEvent, render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { MarkdownFileReferenceToken } from "./MarkdownFileReferenceToken.lynx";

describe("Lynx markdown file reference token", () => {
  it("preparses every initial transcript markdown surface before rendering list cells", () => {
    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    const querySource = readFileSync(new URL("../../app/queries.ts", import.meta.url), "utf8");
    const transcriptSource = readFileSync(
      new URL("../../app/Transcript.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("readonly preparsedTree?: MarkdownNode | null;");
    expect(source).toContain("if (hasPreparsedTree) return;");
    expect(source).toContain("const tree = hasPreparsedTree ? preparsedTree : parsedTree;");
    expect(querySource).toContain("...markdownWorkEntries.map((entry) =>");
    expect(querySource).toContain("parseMarkdown(");
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
      /\.MdListMarker\s*\{[^}]*font-size:\s*inherit;[^}]*line-height:\s*inherit;/s,
    );
    expect(styles).toMatch(
      /\.MdBlockquote\s*\{[^}]*border-left-width:\s*2px;[^}]*border-left-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.MdMathBlockShell\s*\{[^}]*border-left-width:\s*3px;[^}]*border-left-style:\s*solid;[^}]*border-left-color:\s*var\(--primary\);/s,
    );
    expect(styles).toMatch(
      /\.MdTaskCheckbox\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--color-border\);[^}]*border-right-color:\s*var\(--color-border\);[^}]*border-bottom-color:\s*var\(--color-border\);[^}]*border-left-color:\s*var\(--color-border\);/s,
    );
    expect(styles).toMatch(
      /\.MdTaskCheckbox--checked\s*\{[^}]*border-top-color:\s*var\(--primary\);[^}]*border-right-color:\s*var\(--primary\);[^}]*border-bottom-color:\s*var\(--primary\);[^}]*border-left-color:\s*var\(--primary\);/s,
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
      /\.MdTableHeaderCell,\s*\.MdTableCell\s*\{[^}]*width:\s*0;[^}]*min-width:\s*0;[^}]*flex:\s*1;[^}]*border-right-width:\s*1px;[^}]*border-right-style:\s*solid;[^}]*border-right-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.MdTableHeaderText,\s*\.MdTableCellText\s*\{[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere;/s,
    );
    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain(
      "return <MarkdownTable context={context} key={key} node={node} nodeKey={key} />;",
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
    expect(reference?.querySelector(".MdInlineTokenFileIcon")).not.toBeNull();
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

  it("uses a stable inline-file glyph without mounting the full file icon component", () => {
    const source = readFileSync(
      new URL("./MarkdownFileReferenceToken.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("import fileTextSvg from '@synara-central-icons/file-text.svg?raw'");
    expect(source).toContain("content={colorizeLynxSvg(fileTextSvg, svgColors.iconSecondary)}");
    expect(source).not.toContain("FileEntryIcon");
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
      "import { highlightExplorerCode } from '../../data/synaraClient.lynx'",
    );
    expect(source).toContain(
      "const [highlighted, setHighlighted] = useState<NativeSyntaxHighlightResult | null>(null)",
    );
    expect(source).toContain("highlightExplorerCode({ code: presentation.code, path })");
    expect(source).toContain("color: token.color");
  });
});
