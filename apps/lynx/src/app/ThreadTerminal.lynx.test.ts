import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx thread terminal", () => {
  it("uses canonical PTY RPCs with snapshot refresh", () => {
    const terminalSource = readFileSync(
      new URL("./ThreadTerminal.lynx.tsx", import.meta.url),
      "utf8",
    );
    const terminalPortSource = readFileSync(
      new URL("../platform/terminal.ts", import.meta.url),
      "utf8",
    );
    const webHostSource = readFileSync(new URL("../main/web/web-host.ts", import.meta.url), "utf8");
    const desktopHostSource = readFileSync(
      new URL("../main/desktop/main.ts", import.meta.url),
      "utf8",
    );
    const terminalCss = readFileSync(new URL("./thread-terminal.css", import.meta.url), "utf8");
    const webTerminalRuntimeSource = readFileSync(
      new URL("../../../web/src/components/terminal/terminalRuntime.ts", import.meta.url),
      "utf8",
    );
    expect(terminalSource).toContain("await platformTerminal.open({");
    expect(terminalSource).toContain("await platformTerminal.write({");
    expect(terminalSource).toContain("void platformTerminal");
    expect(terminalSource).toContain(".resize({ threadId, terminalId, ...grid })");
    expect(terminalSource).toContain("await closeLynxTerminalSession({");
    expect(terminalSource).toContain("close: platformTerminal.close");
    expect(terminalSource).toContain("writeExit: platformTerminal.write");
    expect(terminalSource).not.toContain("if (snapshot) {");
    expect(terminalSource).toContain("await refresh();");
    expect(terminalSource).toContain('from "@synara/shared/terminalTextProjection"');
    expect(terminalSource).toContain("resetProjection(`${next.replayPreamble}${next.history}`)");
    expect(terminalSource).toContain("textProjectorRef.current.write(event.data)");
    expect(terminalSource).toContain("textProjectorRef.current.toStyledLines()");
    expect(terminalSource).toContain("setProjectedCursor(textProjectorRef.current.toCursor())");
    expect(terminalSource).toContain("terminalLineId(threadId, terminalId, line.index)");
    expect(terminalSource).not.toContain("onConfirm={() => selectSearchMatch('next')}");
    expect(terminalSource).toContain('onGlobalEvent("terminal:search"');
    expect(terminalSource).toContain(
      'bridgeCall("shellSetTerminalSearchEnabled", { enabled: true })',
    );
    expect(terminalSource).toContain("findTerminalTextMatches(");
    expect(terminalSource).toContain("nextTerminalTextMatchIndex(");
    expect(terminalSource).toContain("decorateTerminalTextLine(");
    expect(terminalSource).toContain("scrollLynxElementIntoViewById(");
    expect(terminalSource).toContain('accessibility-label="Find"');
    expect(terminalSource).toContain("Previous match (Shift+Enter)");
    expect(terminalSource).toContain("Next match (Enter)");
    expect(terminalSource).toContain("Close search (Esc)");
    expect(terminalSource).toContain("terminalRunClassName(run)");
    expect(terminalSource).toContain('terminalColorClass("fg", foreground)');
    expect(terminalSource).toMatch(
      /const foreground = run\.style\.inverse\s*\? run\.style\.background(?: \?\? ["']terminal-background["'])?\s*:\s*run\.style\.foreground/,
    );
    expect(terminalSource).toMatch(
      /const background = run\.style\.inverse\s*\? run\.style\.foreground(?: \?\? ["']terminal-foreground["'])?\s*:\s*run\.style\.background/,
    );
    expect(terminalSource).toContain('terminalColorClass("bg", background)');
    expect(terminalSource).toContain('foreground?.startsWith("#")');
    expect(terminalSource).toContain('background?.startsWith("#")');
    expect(terminalSource).toContain("fontWeight: String(TERMINAL_BOLD_FONT_WEIGHT)");
    expect(terminalSource).not.toContain("fontWeight: '700'");
    expect(terminalSource).toContain("terminalSearchRunStyle(");
    expect(terminalSource).toContain("projectedLines.length > 0");
    expect(terminalSource).toContain("text-selection={true}");
    expect(terminalSource).toContain("flatten={false}");
    expect(terminalSource).toContain('lineIndex < projectedLines.length - 1 ? "\\n" : ""');
    expect(terminalSource).not.toContain("Terminal ready.");
    expect(terminalSource).not.toContain("projectedOutput");
    expect(terminalSource).not.toContain("{snapshot?.replayPreamble ?? ''}");
    expect(terminalSource).toContain("onOpenChange(false)");
    expect(terminalSource).toContain("autoOpenAttemptKeyRef.current = null;");
    expect(terminalSource.match(/autoOpenAttemptKeyRef\.current = null;/g)).toHaveLength(1);
    expect(terminalSource).not.toMatch(
      /\.catch\(\(cause\) => \{\s*autoOpenAttemptKeyRef\.current = null;/s,
    );
    expect(terminalSource).toContain("<Input");
    expect(terminalSource).toContain("ref={commandInputRef}");
    expect(terminalSource).toContain("nativeInput");
    expect(terminalSource).toContain("terminalCommittedInputDelta(");
    expect(terminalSource).toContain("if (!active || isComposing) return;");
    expect(terminalSource).toContain(
      "const terminalWriteQueueRef = useRef<Promise<void>>(Promise.resolve())",
    );
    expect(terminalSource).toContain("if (!active || !open || !data) return;");
    expect(terminalSource).toContain(
      "if (terminalInputGenerationRef.current !== generation) return;",
    );
    expect(terminalSource).toContain("if (backendGridRef.current === null) await refresh();");
    expect(terminalSource).toContain("const submitTerminalInput = () => {");
    expect(terminalSource).toContain('enqueueTerminalInput("\\r")');
    expect(terminalSource).toContain('className="ThreadTerminalInputProxy"');
    expect(terminalSource).toContain('className="ThreadTerminalInputProxyAnchor"');
    expect(terminalSource).toContain("style={cursorGeometry.inputProxyStyle}");
    expect(terminalSource.indexOf('className="ThreadTerminalInputProxyAnchor"')).toBeLessThan(
      terminalSource.indexOf("<view id={terminalBottomId"),
    );
    expect(terminalSource).toContain("handleTerminalInput(value, isComposing)");
    expect(terminalSource).toContain("onConfirm={submitTerminalInput}");
    expect(terminalSource).toContain("const focusTerminalInput = () => {");
    expect(terminalSource).toContain("setInputFocused(true);");
    expect(terminalSource).toContain("bindmousedown={focusTerminalInput}");
    expect(terminalSource).toContain("bindtap={focusTerminalInput}");
    expect(terminalSource).toContain('bridgeCall("shellSetTerminalInputEnabled", {');
    expect(terminalSource).toContain('const owner = threadId + "\\u0000" + terminalId;');
    expect(terminalSource).toContain('onGlobalEvent("terminal:input-key"');
    expect(terminalSource).toContain(
      'bridgeCall("shellSetTerminalInputEnabled", {\n        enabled: false,\n        owner,',
    );
    expect(terminalSource).toContain("if (!active || !open || !inputFocused) return;");
    expect(terminalSource).toContain("requestTerminalInputFocus(selectionOwner);");
    expect(terminalSource).toContain("confirmTerminalInputFocus(selectionOwner)");
    expect(terminalSource).toContain("releaseTerminalInputFocus(selectionOwner);");
    expect(terminalSource).toContain("commandInputRef.current?.blur().catch(() => undefined)");
    expect(terminalSource).toContain('className="ThreadTerminalScreen"');
    expect(terminalSource).toContain("style={{ minHeight: cursorGeometry.screenMinHeight }}");
    expect(terminalSource).toContain('" ThreadTerminalCursor--blink"');
    expect(terminalSource).toContain("style={cursorGeometry.cursorStyle}");
    expect(terminalSource).toContain("cursorGeometry.renderText");
    expect(terminalSource).toContain("{projectedCursor.text}");
    expect(terminalCss).toContain("@keyframes ThreadTerminalCursorBlink");
    expect(terminalCss).toContain(".ThreadTerminalInputProxyAnchor {");
    expect(terminalCss).toContain("position: absolute;");
    expect(terminalCss).toContain("overflow: hidden;");
    expect(terminalCss).not.toMatch(/.ThreadTerminalInputProxys*{[^}]*(?:left|bottom):/s);
    expect(terminalCss).toContain("animation: ThreadTerminalCursorBlink 1s step-end infinite;");
    expect(terminalCss).toContain("background-color: var(--color-token-terminal-foreground);");
    expect(terminalCss).toMatch(
      /\.ThreadTerminalOutputScroller\s*\{[^}]*background-color:\s*var\(--color-token-terminal-background\);/s,
    );
    expect(terminalCss).toMatch(
      /\.ThreadTerminalOutputScroller\s*\{[^}]*padding:\s*12px 32px 14px 12px;/s,
    );
    expect(terminalCss).toMatch(
      /\.ThreadTerminalOutput(?:Line)?\s*\{[^}]*color:\s*var\(--color-token-terminal-foreground\);/s,
    );
    expect(terminalCss).not.toContain("background-color: #101010;");
    expect(terminalCss).not.toContain("color: #e8e8e8;");
    expect(terminalCss).toContain(
      `.ThreadTerminalRun--fg-blue {
  color: var(--color-token-terminal-ansi-blue);
}`,
    );
    expect(terminalCss).toContain(
      `.ThreadTerminalRun--fg-bright-black {
  color: var(--color-token-terminal-ansi-bright-black);
}`,
    );
    expect(webTerminalRuntimeSource).toContain(
      'const TERMINAL_CURSOR_STYLE: NonNullable<SynaraTerminalOptions["cursorStyle"]> = "bar"',
    );
    expect(webTerminalRuntimeSource).toContain("const TERMINAL_CURSOR_WIDTH = 1;");
    expect(webTerminalRuntimeSource).toContain("cursorBlink: true,");
    expect(terminalSource).not.toContain("ThreadTerminalCommandRow");
    expect(terminalSource).not.toContain("sleepOnHost");
    expect(terminalSource).not.toContain("value={command}");
    expect(terminalSource).toContain('commandInputRef.current?.setValue("")');
    expect(terminalSource).toContain("streamOutput: true");
    expect(terminalSource).toContain("bindlayoutchange={handleOutputLayout}");
    expect(terminalSource).toContain('className="ThreadTerminalOutputViewport"');
    expect(terminalSource).toContain("id={terminalViewportId(threadId, terminalId)}");
    expect(terminalSource).toContain("flatten={false}");
    expect(terminalSource).toContain("getRectById(terminalViewportId(threadId, terminalId), true)");
    expect(terminalSource).toContain("INITIAL_MEASURE_DELAYS_MS.map");
    expect(terminalSource).toContain('onGlobalEvent("viewport:resize", measureTerminalViewport)');
    expect(terminalSource).toContain("resolveLynxTerminalGridSize({");
    expect(terminalSource).toContain("cols: openGrid.cols");
    expect(terminalSource).toContain("rows: openGrid.rows");
    expect(terminalSource).toContain("resetProjection(terminalReplayRef.current, grid)");
    expect(terminalSource).toContain("resolveTerminalPinnedFromScroll({");
    expect(terminalSource).toContain("if (!activeRef.current || !pinnedRef.current) return;");
    expect(terminalSource).toContain("bindscrolltolower={() => {");
    expect(terminalSource).toContain("scroll-event-throttle={24}");
    expect(terminalSource).toContain("scroll-y={true}");
    expect(terminalSource).toContain("terminalBottomId(threadId, terminalId)");
    expect(terminalSource).toContain('accessibleLabel: "Scroll to bottom"');
    expect(terminalSource).toContain("color={svgColors.mutedForeground}");
    expect(terminalCss).toMatch(
      /\.ThreadTerminalJumpIcon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*opacity:\s*0\.8;/s,
    );
    expect(terminalSource).toContain("platformTerminal.ackOutput({");
    // One terminal stream per socket: the shared facade owns it.
    expect(terminalSource).toContain("return ensureNativeApi().terminal.onEvent(acceptEvent);");
    expect(terminalSource).not.toContain('"synara:terminal-event"');
    expect(terminalSource).not.toContain("synaraClient");
    expect(terminalSource).toContain("applyTerminalEventToSnapshot({");
    expect(terminalSource).toContain("readSettingsBehaviorProjection(");
    expect(terminalSource).toContain("webStorage.getItem(APP_SETTINGS_STORAGE_KEY)");
    expect(terminalSource).toContain('snapshot?.status === "running"');
    expect(terminalSource).toContain("if (pending || confirmingClose) return;");
    expect(terminalSource).toContain("setConfirmingClose(true);");
    expect(terminalSource).toContain("setConfirmingClose(false);");
    expect(terminalSource).toContain("confirmTerminalTabClose({");
    expect(terminalSource).toContain("confirmationEnabled");
    expect(terminalSource).toContain("resolveLynxTerminalTypography({");
    expect(terminalSource).toContain('className="ThreadTerminalOutput"');
    expect(terminalSource).toContain("style={typography}");
    expect(terminalPortSource).toContain('"runtimeGetSynaraWsUrl"');
    expect(terminalPortSource).toContain("callTerminalBridge(");
    expect(terminalPortSource).toContain(
      '"terminalOpen", await withTerminalRuntimeEndpoint(input)',
    );
    expect(terminalPortSource).toContain('result._tag === "NativeRpcResult"');
    expect(terminalPortSource).toContain("await withTerminalRuntimeEndpoint(input)");
    expect(terminalPortSource).toContain('callTerminalBridge("terminalResize",');
    expect(webHostSource).toContain('if (method === "terminalOpen")');
    expect(webHostSource).toContain('"terminal.open"');
    expect(webHostSource).toContain('if (method === "terminalWrite")');
    expect(webHostSource).toContain('"terminal.write"');
    expect(webHostSource).toContain('if (method === "terminalResize")');
    expect(webHostSource).toContain('"terminal.resize"');
    expect(webHostSource).toContain('if (method === "terminalClose")');
    expect(webHostSource).toContain('"terminal.close"');
    expect(desktopHostSource).toContain('name === "terminalOpen"');
    expect(desktopHostSource).toContain('name === "terminalWrite"');
    expect(desktopHostSource).toContain('name === "terminalResize"');
    expect(desktopHostSource).toContain('? "terminal.resize"');
    expect(desktopHostSource).toContain('name === "terminalAckOutput"');
    expect(desktopHostSource).toContain('name === "terminalClose"');
  });

  it("is wired through the editor rail without Lynx-only thread-header text actions", () => {
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    expect(routerSource).toContain("import { ThreadTerminal }");
    expect(routerSource).toContain(
      'rightDockState.open && activeRightDockPane?.kind === "terminal"',
    );
    expect(routerSource).toContain(
      'openPaneInState(current, { paneId: "terminal", kind: "terminal" })',
    );
    expect(routerSource).toContain("const [editorTerminalOpen, setEditorTerminalOpen]");
    expect(routerSource).toContain("const openEditorTerminal = () => {");
    expect(routerSource).toContain('setEditorRailSurface("terminal")');
    expect(routerSource).toContain("onOpenEditorView={enterEditorMode}");
    expect(routerSource).toContain('<view className="ThreadHeaderControls">');
    expect(routerSource).toContain("<ThreadHeaderActions");
    expect(routerSource).not.toContain(
      '<view className="ThreadHeaderControls">\n          <Button',
    );
    expect(routerSource.match(/<ThreadTerminal[\s\S]{0,120}autoOpen/g)).toHaveLength(1);
    expect(routerSource).toContain("<DockTerminalPane");
    expect(routerSource).toContain('terminalId="lynx-editor-rail"');
    expect(routerSource).toContain('active={editorRailSurface === "terminal"}');
    expect(routerSource).toContain("className={`ThreadRightDockTerminalPane");
    expect(routerSource).toContain("terminalHydrated");
    // Terminal is a right-dock surface with and without a side chat.
    expect(routerSource).toContain(
      '"diff",\n          "explorer",\n          "terminal",\n          "sidechat",',
    );
    expect(routerSource).toContain('"diff", "explorer", "terminal", "git"]');
    expect(routerSource).not.toContain(
      "{currentThread?.workspaceRoot ? (\n        <ThreadTerminal",
    );
    expect(routerSource).toContain("fontFamily={appearance.terminalFontFamily}");
    expect(routerSource).toContain("fontSizePx={appearance.terminalFontSizePx}");
    expect(routerSource).toContain("workspaceRoot={currentThread.workspaceRoot}");
  });
});
