import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";
import { DEFAULT_SERVER_SETTINGS_VIEW } from "@synara/contracts";

import {
  providerFieldPatch,
  providerFieldValue,
  providerToolResetPatch,
} from "./settingsProviderTools.logic";

describe("Settings Provider tools fidelity", () => {
  it("normalizes default commands and builds canonical server patches", () => {
    expect(providerFieldValue(DEFAULT_SERVER_SETTINGS_VIEW, "codexBinaryPath")).toBe("");
    expect(providerFieldValue(DEFAULT_SERVER_SETTINGS_VIEW, "claudeBinaryPath")).toBe("");
    expect(providerFieldValue(DEFAULT_SERVER_SETTINGS_VIEW, "piAgentDir")).toBe("");

    expect(providerFieldPatch("codexBinaryPath", "/opt/bin/codex")).toEqual({
      providers: { codex: { binaryPath: "/opt/bin/codex" } },
    });
    expect(providerFieldPatch("cursorApiEndpoint", "https://cursor.test")).toEqual({
      providers: { cursor: { apiEndpoint: "https://cursor.test" } },
    });
    expect(providerFieldPatch("openCodeServerPassword", "")).toEqual({
      providers: { opencode: { serverPassword: "" } },
    });
    expect(providerFieldPatch("piAgentDir", "/tmp/pi-agent")).toEqual({
      providers: { pi: { agentDir: "/tmp/pi-agent" } },
    });
  });

  it("resets every editable provider-tools field without writing redacted flags", () => {
    const patch = providerToolResetPatch();

    expect(Object.keys(patch.providers ?? {})).toEqual([
      "codex",
      "claudeAgent",
      "cursor",
      "antigravity",
      "grok",
      "droid",
      "opencode",
      "pi",
    ]);
    expect(patch.providers?.opencode).toMatchObject({
      binaryPath: "opencode",
      serverUrl: "",
      serverPassword: "",
      experimentalWebSockets: false,
    });
    expect(patch.providers?.opencode).not.toHaveProperty("serverPasswordConfigured");
  });

  it("owns the complete update, disclosure, override, and reset workflows", () => {
    const source = readFileSync(
      new URL("./SettingsProviderToolsPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const clientSource = readFileSync(
      new URL("../data/synaraClient.lynx.ts", import.meta.url),
      "utf8",
    );
    const settingsSource = readFileSync(new URL("./SettingsPage.tsx", import.meta.url), "utf8");
    const providerUpdatesSource = readFileSync(
      new URL("../../../web/src/providerUpdates.ts", import.meta.url),
      "utf8",
    );

    expect(source).toContain('queryKey: ["server-config"]');
    expect(source).toContain('queryKey: ["server-settings"]');
    expect(source).toContain("withProviderUpdateTimeout({");
    expect(source).toContain("request: updateProvider(provider)");
    expect(source).toContain("providerUpdateFailureMessage(");
    expect(source).toContain("providerUpdateFailureMessage,\n  providerUpdateStatusLabel,");
    expect(providerUpdatesSource).toContain('if (typeof value !== "string") return null;');
    expect(providerUpdatesSource).toContain(
      'state.status !== "failed" && state.status !== "unchanged"',
    );
    expect(source).toContain("updateServerSettings(patch)");
    expect(source).toContain('queryClient.setQueryData(["server-settings"], settings)');
    expect(clientSource).toContain('transportRequest("server.updateProvider", { provider })');
    expect(source).toContain("getVisibleProviderUpdateStatuses({");
    expect(source).toContain("shouldShowProviderUpdateStatus({");
    expect(source).toContain("Automatic CLI update checks");
    expect(source).toContain("Provider updates");
    expect(source).toContain("id={SETTINGS_TARGETS.providerUpdates}");
    expect(source).toContain("Installed CLIs");
    expect(source.match(/<text className="LxButton__text">/g)).toHaveLength(2);
    expect(source.match(/color={svgColors.foreground80}/g)).toHaveLength(2);
    expect(source.match(/\{props\.updating \? ["']Updating…["'] : ["']Update["']\}/g)).toHaveLength(
      2,
    );
    expect(source).toContain("Reset provider tools to default");
    expect(source).toContain("useLynxDisclosurePresence(props.open)");
    expect(source).toContain("disclosureContentClassName(");
    expect(source).toContain("disclosureChevronClassName(");
    expect(source).toContain("openExternalBestEffort(props.href)");
    expect(source).toContain('from "@synara/shared/providerTools"');
    expect(source).toContain("PROVIDER_TOOL_CONFIGS");
    expect(source).toContain("providerToolDescriptionText");
    expect(source).not.toContain("provider: 'opencode'");
    expect(source).not.toContain("id: 'openCodeExperimentalWebSockets'");
    expect(settingsSource).toContain("providerPicker={");

    const panelStart = settingsSource.indexOf("<SettingsProviderToolsPanel");
    const pickerStart = settingsSource.indexOf("<SettingsProviderPickerComposition", panelStart);
    const panelEnd = settingsSource.indexOf("/>", pickerStart);
    expect(panelStart).toBeGreaterThan(-1);
    expect(pickerStart).toBeGreaterThan(panelStart);
    expect(panelEnd).toBeGreaterThan(pickerStart);
  });

  it("matches the Web inset-list and disclosure anatomy", () => {
    const panelSource = readFileSync(
      new URL("./SettingsProviderToolsPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(
      new URL("./settings-provider-tools-panel.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(/\.SettingsProviderToolsRoot\s*\{[^}]*gap:\s*24px;/s);
    expect(styles).toMatch(
      /\.SettingsProviderToolsSummaryRow\s*\{[^}]*padding:\s*var\(--app-density-settings-row-padding-y,\s*10px\) 12px;[^}]*gap:\s*20px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsProviderToolsList\s*\{[^}]*margin:\s*6px 12px 12px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-radius:\s*10px;/s,
    );
    expect(styles).toMatch(/\.SettingsProviderToolsList--updates\s*\{[^}]*margin:\s*16px 0 0;/s);
    expect(styles).toMatch(
      /\.SettingsProviderToolsListRow\s*\{[^}]*min-height:\s*58px;[^}]*padding:\s*var\(--app-density-settings-row-padding-y,\s*10px\) 12px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsProviderToolsDisclosureMain\s*\{[^}]*min-height:\s*44px;[^}]*padding:\s*8px 12px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsProviderToolsDisclosure--divided\s*\{[^}]*border-top-width:\s*1px;[^}]*border-top-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.SettingsProviderToolsDisclosureContent\s*\{[^}]*padding:\s*12px;[^}]*border-top:\s*1px solid var\(--border\);[^}]*gap:\s*12px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsProviderToolsFieldInput\s*\{[^}]*height:\s*28px;[^}]*margin-top:\s*4px;/s,
    );
    expect(panelSource).toContain("accessibility-label={props.field.label}");
    expect(panelSource).toContain("<Input\n        nativeInput");
    expect(styles).toMatch(
      /\.SettingsProviderToolsBooleanField\s*\{[^}]*padding:\s*8px 12px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-left-color:\s*var\(--border\);[^}]*border-radius:\s*6px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsProviderToolsSummaryRow--continued\s*\{[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).not.toContain(":first-child");
    expect(styles).not.toContain(":not(");
  });
});
