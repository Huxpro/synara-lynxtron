import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx assistant message actions", () => {
  it("writes a thread-scoped canonical assistant selection from the hover footer", () => {
    const source = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");

    expect(source).toContain("createAssistantSelectionAttachment({");
    expect(source).toContain("assistantMessageId: message.id");
    expect(source).toContain("addAssistantSelection(threadId, selection)");
    expect(source).toContain("getAssistantSelectionValidationError({");
    expect(source).toContain("draftAttachmentCount >= PROVIDER_SEND_TURN_MAX_ATTACHMENTS");
    expect(source).toContain("disabled: assistantSelectionUnavailable");
    expect(source).toContain('addToChat.disabled ? " ui-disabled" : ""');
    expect(source).toContain("Reference whole assistant message");
    expect(source).toContain("baseClassName: `TranscriptMessageHoverRegion LynxWebHoverOwner ${");
    expect(source).toContain("focusable: false");
    expect(source).toContain("TranscriptMessageFooter");
    expect(source).toContain("<MessageCircleIcon");
    expect(source).not.toContain("Reference selection");
    expect(routerSource).toContain("threadId={threadId}");
  });

  it("exposes real pin, copy, and timestamp actions on hover", () => {
    const source = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(source).toContain('"thread.pinned-message.add"');
    expect(source).toContain('"thread.pinned-message.remove"');
    expect(source).toContain('import(/* webpackMode: "eager" */ "../platform/clipboard")');
    expect(source).toContain("formatShortTimestamp(");
    expect(styles).toMatch(
      /\.TranscriptMessageHoverRegion\.ui-hover \.TranscriptMessageFooter,[\s\S]*?opacity:\s*1;/s,
    );
    expect(styles).toMatch(
      /\.TranscriptMessageAction\.ui-hover\s*\{[^}]*background-color:\s*var\(--color-background-button-tertiary-hover\);/s,
    );
    expect(styles).toMatch(
      /\.TranscriptMessageAction\.ui-focus\s*\{[^}]*box-shadow:\s*0 0 0 1px var\(--color-border-focus\);/s,
    );
    expect(styles).toMatch(
      /\.TranscriptMessageAction\.ui-pressed\s*\{[^}]*background-color:\s*var\(--color-background-button-tertiary-active\);/s,
    );
    expect(styles).toMatch(
      /\.TranscriptMessageActionIcon\s*\{[^}]*color:\s*var\(--color-icon-secondary\);/s,
    );
    expect(source).toContain("colorizeLynxSvg(pinSvg, svgColors.iconSecondary)");
    expect(source.match(/color=\{svgColors\.iconSecondary\}/g)?.length).toBeGreaterThanOrEqual(5);
    const labSource = readFileSync(
      new URL("./ComponentsLabStoryRenderer.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(labSource.match(/color=\{svgColors\.iconSecondary\}/g)?.length).toBeGreaterThanOrEqual(
      5,
    );
    expect(styles).not.toMatch(
      /\.TranscriptMessageAction\.ui-(?:hover|focus)[^{]*\s+\.TranscriptMessageActionIcon\s*\{[^}]*color:/s,
    );
    expect(styles).not.toMatch(/\.SliceRoot--theme-(?:light|dark)\s+\.TranscriptMessageAction/);
  });

  it("reuses the Web message-trail projection for wide transcript navigation", () => {
    const source = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(source).toContain("deriveMessageTrailItems");
    expect(source).toContain('from "@synara-web/components/chat/messageTrail.logic"');
    expect(source).toContain("function TranscriptMessageTrail(");
    expect(source).toContain("isMessageTrailEligible({");
    // Mounted in the full-width transcript shell, the rail sits at the pane's left
    // edge (CSS left: 0) like the web rail; no offset that could reach the sidebar.
    expect(source).not.toContain("resolveMessageTrailPaneEdgeOffset");
    expect(styles).toMatch(
      /\.TranscriptMessageTrail\s*\{[^}]*position:\s*absolute;[^}]*left:\s*0;/s,
    );
    expect(source).toContain("focusDistance={");
    expect(source).toContain("onHoverChange={setHoveredIndex}");
    expect(source).toContain('accessibility-label="Message navigation"');
    expect(source).toContain("onActivate={() => props.onSelect(item.id)}");
    expect(source).toContain("onSelect={scrollToMessage}");
    expect(source).toContain('className="TranscriptListItem"');
    expect(source).toContain('<ComposerColumnFrameSurface className="TranscriptRowFrame">');
    expect(source).toContain("useState(createActiveTrailStore)");
    expect(source).toContain("useSyncExternalStore(");
    expect(source).toContain("resolveVisibleRowRangeFromAttachedCells({");
    expect(source).toContain("resolveActiveTrailSnapshot(");
    expect(styles).toMatch(
      /\.TranscriptMessageTrailItem--focused \.TranscriptMessageTrailTooltip\s*\{[^}]*opacity:\s*1;/s,
    );
    expect(styles).toMatch(
      /\.TranscriptMessageTrailTooltip\s*\{[^}]*width:\s*256px;[^}]*min-height:\s*56px;/s,
    );
    expect(styles).toMatch(
      /\.TranscriptMessageTrailItem--focused \.TranscriptMessageTrailTick\s*\{[^}]*width:\s*30px;[^}]*opacity:\s*1;/s,
    );
    expect(styles).toMatch(
      /\.TranscriptMessageTrailItem--near \.TranscriptMessageTrailTick\s*\{[^}]*width:\s*20px;/s,
    );
    expect(styles).toMatch(
      /\.TranscriptMessageTrailItem--far \.TranscriptMessageTrailTick\s*\{[^}]*width:\s*12px;/s,
    );
    expect(styles).toMatch(/\.TranscriptMessageTrailItem\s*\{[^}]*overflow:\s*visible;/s);
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const sidechatSource = readFileSync(
      new URL("./EmbeddedSidechatPane.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(routerSource).toContain("viewportWidth={threadHeaderAvailableWidth}");
    expect(routerSource).toContain('<view className="ThreadTranscriptColumn">');
    expect(routerSource).not.toContain(
      '<ComposerColumnFrameSurface className="ThreadTranscriptColumn">',
    );
    expect(sidechatSource).toContain('<view className="ThreadTranscriptColumn">');
    expect(sidechatSource).not.toContain(
      '<ComposerColumnFrameSurface className="ThreadTranscriptColumn">',
    );
    expect(styles).toMatch(/\.TranscriptListItem\s*\{[^}]*width:\s*100%;/s);
    expect(styles).toMatch(/\.TranscriptRowFrame\s*\{[^}]*width:\s*calc\(100% - 24px\);/s);
    expect(styles).toMatch(
      /\.TranscriptMessageTrailTick--visible \.TranscriptMessageTrailTick\s*\{[^}]*opacity:\s*0\.52;/s,
    );
    expect(styles).toMatch(
      /\.TranscriptMessageTrailTick--active \.TranscriptMessageTrailTick\s*\{[^}]*opacity:\s*0\.9;/s,
    );
  });

  it("keeps expanded Thinking tool details structured and typographically aligned", () => {
    const source = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(source).toContain("function TranscriptToolDetailsDisclosure(");
    expect(source).toContain("useLynxDisclosurePresence(open)");
    expect(source).toContain("formatShellTranscript(details.command, details.output)");
    expect(source).toContain("createMarkdownCodeFence(block.language, block.text)");
    expect(source).toContain('className="TranscriptToolDetailsMarkdown"');
    expect(source).toContain("getChatTranscriptLineHeightPx(props.chatFontSizePx)");
    expect(source).toContain(
      'displayText={row.kind === "working-header" ? "Working…" : "Thinking"}',
    );
    expect(source).toContain('displayText={message.text || "System"}');
    expect(source).toContain('displayText="Plan ready"');
    expect(source.match(/fontSizePx=\{chatFontSizePx\}/g)).toHaveLength(4);
    expect(source).toContain("fontSizePx={chatFontSizePx}");
    expect(styles).toMatch(/\.TranscriptToolDetailsPanel\s*\{[^}]*padding-left:\s*20px;/s);
    expect(styles).toMatch(
      /\.TranscriptReasoningEntry \.MdHeading,[\s\S]*?font-size:\s*inherit;[\s\S]*?line-height:\s*inherit;/s,
    );
    expect(styles).toMatch(
      /\.TranscriptToolDetailsMarkdown \.MdCodeBlockText\s*\{[^}]*font-size:\s*var\(--transcript-tool-details-font-size\);[^}]*line-height:\s*var\(--transcript-tool-details-line-height\);/s,
    );
  });

  it("uses the shared checkpoint mapping and canonical command for message revert", () => {
    const transcriptSource = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    const querySource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
    const webSource = readFileSync(
      new URL("../../../web/src/components/ChatView.tsx", import.meta.url),
      "utf8",
    );

    expect(querySource).toContain("buildRevertTurnCountByUserMessageId({");
    expect(webSource).toContain("buildRevertTurnCountByUserMessageId({");
    expect(transcriptSource).toContain('accessibleLabel: "Revert to this message"');
    expect(transcriptSource).toContain("await dialogs.confirm(");
    expect(transcriptSource).toContain('type: "thread.checkpoint.revert"');
    expect(transcriptSource).toContain('scope: "thread"');
    expect(transcriptSource).toContain('"Failed to revert message."');
  });

  it("edits only the latest eligible user message through the canonical replay command", () => {
    const transcriptSource = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const editFormSource = readFileSync(
      new URL("./TranscriptUserMessageEditForm.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(transcriptSource).toContain("resolveLatestTailUserMessageEditTarget({");
    expect(transcriptSource).toContain("target.messageId !== messageId");
    expect(transcriptSource).toContain("appendOriginalComposerPromptBlocks({");
    expect(transcriptSource).toContain("formatOutgoingComposerPrompt({");
    expect(transcriptSource).toContain('type: "thread.message.edit-and-resend"');
    expect(transcriptSource).toContain("modelSelection,");
    expect(transcriptSource).toContain("runtimeMode,");
    expect(transcriptSource).toContain("interactionMode,");
    expect(editFormSource).toContain('accessibility-label="Edit message"');
    expect(transcriptSource).toContain("setEditError(message);");
    expect(routerSource).toContain("onThreadError={setLocalThreadError}");
  });
});
