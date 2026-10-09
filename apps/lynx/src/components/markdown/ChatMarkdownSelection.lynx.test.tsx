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
    expect(markdownSource).toContain('method: "getSelectedText"');
    expect(markdownSource).toContain('method: "getTextBoundingRect"');
    expect(markdownSource).toContain("width: result.boundingRect.width");
    expect(markdownSource).toContain("height: result.boundingRect.height");
    expect(markdownSource).toContain('className="MdParagraph" context={context}');
    expect(transcriptSource).toContain("<ChatMarkdown cwd={workspaceRoot}");
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
    expect(transcriptSource).toContain("TranscriptSelectionToolbar--${layout.placement}");
    // Actions fire on press so the native selection survives; the follow-up tap is swallowed.
    expect(transcriptSource).toContain("catchmousedown={() => {");
    expect(transcriptSource).toContain("pressActivatedRef");
    for (const label of ['label="Add to Chat"', 'label="Add to Side"', 'label="Add to new Chat"']) {
      expect(transcriptSource).toContain(label);
    }
    // Electron removed saved highlights and underlines (upstream #1131).
    expect(transcriptSource).not.toContain("<PencilIcon");
    expect(transcriptSource).not.toContain('TranscriptSelectionActionGlyph">✎');
    expect(transcriptSource).toContain("setSelectedAssistantMessageId(null);");
    expect(transcriptSource).toContain("setTextSelection(null);");
    expect(styles).toMatch(
      /\.TranscriptSelectionToolbarStrip\s*\{[^}]*border:\s*1px solid var\(--border\);[^}]*border-radius:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.TranscriptSelectionAction\s*\{[^}]*height:\s*28px;[^}]*padding:\s*0 10px;/s,
    );
    expect(styles).toContain(".TranscriptSelectionToolbar--top");
    expect(styles).toContain(".TranscriptSelectionToolbar--bottom");
  });
});
