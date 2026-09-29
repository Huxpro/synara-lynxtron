import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx transcript text selection", () => {
  it("enables native selection on block text without flattening nested markdown", () => {
    const markdownSource = readFileSync(
      new URL("./ChatMarkdown.lynx.tsx", import.meta.url),
      "utf8",
    );
    const transcriptSource = readFileSync(
      new URL("../../app/Transcript.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("../../app/App.css", import.meta.url), "utf8");

    expect(markdownSource).toContain("text-selection={props.context.selectable}");
    expect(markdownSource).toContain("custom-context-menu={selectionEnabled}");
    expect(markdownSource).toContain("flatten={false}");
    expect(markdownSource).toContain("bindselectionchange={");
    expect(markdownSource).toContain("method: 'getSelectedText'");
    expect(markdownSource).toContain("method: 'getTextBoundingRect'");
    expect(markdownSource).toContain("width: result.boundingRect.width");
    expect(markdownSource).toContain("height: result.boundingRect.height");
    expect(markdownSource).toContain('className="MdParagraph"\n          context={context}');
    expect(transcriptSource).toContain("<ChatMarkdown\n              cwd={workspaceRoot}");
    expect(transcriptSource).toContain(
      "onOpenFileReference={onOpenFileReference}\n                onTextSelection={onTextSelectionChange}",
    );
    expect(transcriptSource).toContain(
      "preparsedTree={row.markdownTree}\n                selectable",
    );
    expect(transcriptSource).toContain("<TranscriptSelectionAction");
    expect(transcriptSource).toContain("resolveSelectionActionLayout({");
    expect(transcriptSource).toContain("bindlayoutchange={(event:");
    expect(transcriptSource).toContain("left: viewportLeft + detail.left");
    expect(transcriptSource).toContain("readonly viewportLeft?: number");
    expect(transcriptSource).toContain("viewport: props.viewport");
    expect(transcriptSource).toContain("width: `${layout.width}px`");
    expect(transcriptSource).toContain("const compact = layout.width < 292");
    expect(transcriptSource).toContain("TranscriptSelectionToolbar--${layout.placement}");
    expect(transcriptSource).toContain("catchmousedown={() =>");
    expect(transcriptSource).toContain("addToChatPointerActivationRef");
    expect(transcriptSource).toContain("<PencilIcon");
    expect(transcriptSource).not.toContain('TranscriptSelectionActionGlyph">✎');
    expect(transcriptSource).toContain("setSelectedAssistantMessageId(null);");
    expect(transcriptSource).toContain("setTextSelection(null);");
    expect(styles).toMatch(
      /\.TranscriptSelectionToolbar\s*\{[^}]*width:\s*292px;[^}]*min-height:\s*38px;/s,
    );
    expect(styles).toContain(".TranscriptSelectionToolbar--top");
    expect(styles).toContain(".TranscriptSelectionToolbar--bottom");
    expect(transcriptSource).toContain("type: 'thread.marker.add'");
  });
});
