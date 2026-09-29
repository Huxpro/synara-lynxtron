import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynxtron application menu", () => {
  it("opens Components Lab from the native View menu", () => {
    const source = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    expect(source).toContain('label: "Components Lab…"');
    expect(source).toContain('click: () => dispatchRoute("/components-lab")');
  });
  it("exposes the shared Browser toggle shortcut", () => {
    const source = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    expect(source).toContain('label: "Toggle Browser"');
    expect(source).toContain('accelerator: "CmdOrCtrl+Shift+B"');
    expect(source).toContain('dispatchShellCommand("browser.toggle")');
  });
  it("lets AppKit select the active Native textarea directly", () => {
    const source = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    expect(source).toContain('{ role: "selectAll" }');
    expect(source).not.toContain("click: () => w.sendGlobalEvent('composer:select-all')");
  });

  it("routes Edit commands by the current input owner", () => {
    const source = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    expect(source).toContain("let composerInputOwner: string | null = null");
    expect(source).toContain('name === "shellClaimComposerInputFocus"');
    expect(source).toContain('name === "shellSetComposerInputFocused"');
    expect(source).toContain('terminalSelectionText = ""');
    expect(source).toContain("composerInputOwner !== null");
    expect(source).toContain('click: () => w.sendGlobalEvent("composer:undo")');
    expect(source).toContain('click: () => w.sendGlobalEvent("composer:redo")');
    expect(source).toContain('click: () => w.sendGlobalEvent("composer:cut")');
    expect(source).toContain('click: () => dispatchShellEvent("composer:copy")');
    expect(source).toContain('w.sendGlobalEvent("composer:paste-text", { text })');
    expect(source).toContain('dispatchShellEvent("terminal:input-key", { data: text })');
    expect(source).toContain('{ role: "undo" }');
    expect(source).toContain('{ role: "redo" }');
    expect(source).toContain('{ role: "cut" }');
    expect(source).toContain('{ role: "copy" }');
    expect(source).toContain('{ role: "paste" }');
    expect(source).not.toContain("shell:native-edit");
  });

  it("uses fresh app relaunch accelerators instead of reusing a renderer", () => {
    const lynxSource = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    expect(lynxSource).not.toContain("{ role: 'reload' }");
    expect(lynxSource).not.toContain("{ role: 'forceReload' }");
    expect(lynxSource).toContain('id: "reloadBundle"');
    expect(lynxSource).toContain('accelerator: "CmdOrCtrl+R"');
    expect(lynxSource).toContain('id: "forceReloadBundle"');
    expect(lynxSource).toContain('accelerator: "CmdOrCtrl+Shift+R"');
    expect(lynxSource).toContain("click: () => relaunchApp()");
    expect(lynxSource).toContain("spawn(process.execPath, args, {");
    expect(lynxSource).toContain("try {");
    expect(lynxSource).toContain("let replacement: ReturnType<typeof spawn>");
    expect(lynxSource).toContain("return;");
    expect(lynxSource).toContain('detached: process.env.SYNARA_MANAGED_RELAUNCH !== "1"');
    expect(lynxSource).toContain('replacement.once("spawn"');
    expect(lynxSource).toContain('replacement.once("error"');
    expect(lynxSource).toContain("app.releaseSingleInstanceLock()");
    expect(lynxSource).toContain("app.quit()");
    expect(lynxSource).toContain("if (relaunchRequested) return;");
    expect(lynxSource).not.toContain("function reloadLynxWindow");
    expect(lynxSource).toContain(
      'w.loadURL("http://localhost:5971/main.lynx.bundle", loadOptions)',
    );
    expect(lynxSource).toContain("w.loadFile(LYNX_BUNDLE_PATH, loadOptions)");
    // Every bundle load rebinds the renderer to this host's live backend.
    expect(lynxSource).toContain("runtimeWsUrl: resolveSynaraWsUrl(process.env.SYNARA_WS_URL)");
    expect(lynxSource).toContain('name === "shellReload"');
    expect(lynxSource).toContain("setTimeout(relaunchApp, 0)");
    expect(lynxSource).toContain('name === "shellRouteChanged"');
    expect(lynxSource).toContain('name === "shellUiReady"');
    expect(lynxSource).toContain('process.env.SYNARA_UI_READY_PROBE_IGNORE_ACK === "1"');
    expect(lynxSource).toContain("Number(process.env.SYNARA_UI_READY_TIMEOUT_MS) || 15_000");
    expect(lynxSource).toContain("renderer ui ready acknowledgement ignored by explicit probe");
    expect(lynxSource).toContain("}, rendererUiReadyTimeoutMs);");
    expect(lynxSource).toContain("renderer ui ready timeout route=");
    expect(lynxSource).toContain('title: "Synara could not finish starting"');
    expect(lynxSource).toContain('buttons: ["Reload", "Quit"]');
    expect(lynxSource).toContain('...(isDev ? [{ role: "toggleDevTools" }] : [])');
  });

  it("routes terminal-focused find through a hidden native accelerator", () => {
    const source = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    expect(source).toContain("buildTerminalSearchMenuItems(");
    expect(source).toContain("buildTerminalInputMenuItems(");
    expect(source).toContain('dispatchShellEvent("terminal:search")');
    expect(source).toContain('if (event.key === "Find")');
    expect(source).toContain('event.key === "Reload" || event.key === "ForceReload"');
    expect(source).toContain("relaunchApp();");
    expect(source).toContain("else if (terminalSearchNavigationEnabled)");
    expect(source).toContain('dispatchShellEvent("terminal:search-key", event)');
    expect(source).toContain('dispatchShellEvent("terminal:input-key", { data })');
    expect(source).toContain('else dispatchShellEvent("terminal:copy-selection")');
    expect(source).toContain('click: () => dispatchShellEvent("composer:copy")');
    expect(source).toContain('dispatchShellEvent("terminal:input-key", { data: text })');
    expect(source).toContain('name === "shellSetTerminalSelectionEnabled"');
    expect(source).toContain("terminalSelectionOwner !== null");
    expect(source).toContain(
      "if (terminalSelectionText) clipboard.writeText(terminalSelectionText)",
    );
    expect(source).toContain("clipboard.writeText(terminalSelectionText)");
    expect(source).toContain('terminalSelectionText = nextOwner ? text : ""');
    expect(source).toContain('name === "shellSetTerminalInputEnabled"');
    expect(source).toContain('name === "shellReleaseTerminalInputFocus"');
    expect(source).toContain('name === "shellSetComposerInputBounds"');
    expect(source).toContain('event.key === "FocusComposer"');
    expect(source).toContain("terminalInputOwner = null");
    expect(source).toContain("terminalInputOwner === owner");
    expect(source).toContain('name === "shellSetTerminalSearchEnabled"');
    expect(source).toContain("terminalSearchNavigationEnabled && !searchNavigationEnabled");
    expect(source).toContain(
      "terminalInputOwner !== null &&\n            !searchNavigationEnabled &&\n            !terminalSearchNavigationEnabled",
    );
    expect(source).toContain("terminalSearchNavigationEnabled = false");
    expect(source.indexOf("terminalSearchNavigationEnabled = false")).toBeLessThan(
      source.indexOf("const startupInitData = initDataFromArguments(process.argv)"),
    );
  });

  it("does not forward the event that dismisses a native context menu", () => {
    const source = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    expect(source).toContain("let suppressMenuDismissEscapeUntil = 0");
    expect(source).toContain("if (suppressMenuDismissEscapeUntil > 0)");
    expect(source).toContain("const suppressDismissEscape =");
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("Date.now() < suppressMenuDismissEscapeUntil");
    expect(source).toContain("suppressMenuDismissEscapeUntil = 0");
    expect(source).toContain("if (suppressDismissEscape) return");
    expect(source).toContain("suppressMenuDismissEscapeUntil = Date.now() + 1_000");
    const contextMenuCall = source.indexOf(
      "callback.sendReply(await handleContextMenu(w, name, data))",
    );
    expect(
      source.lastIndexOf("suppressMenuDismissEscapeUntil = Date.now() + 1_000", contextMenuCall),
    ).toBeGreaterThan(-1);
    expect(
      source.indexOf("suppressMenuDismissEscapeUntil = Date.now() + 1_000", contextMenuCall),
    ).toBeGreaterThan(contextMenuCall);
  });
});
