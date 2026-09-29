import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Settings AppSnap capability fidelity", () => {
  it("routes AppSnap through the real Native capability boundary", () => {
    const settingsSource = readFileSync(new URL("./SettingsPage.tsx", import.meta.url), "utf8");
    const panelSource = readFileSync(
      new URL("./SettingsAppSnapPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(settingsSource).toContain("'appsnap',");
    expect(settingsSource).toContain("section === 'appsnap'");
    expect(settingsSource).toContain("<SettingsAppSnapPanel />");
    expect(panelSource).toContain("AppSnap requires the Synara desktop app on macOS.");
    expect(panelSource).toContain("appSnap.onState");
    expect(panelSource).toContain("appSnap.requestPermissions()");
    expect(panelSource).toContain("appSnap.setEnabled(enabled)");
    expect(panelSource).toContain("Both Option keys");
    expect(panelSource).toContain("Custom global chords are not available in this Lynxtron build.");
    expect(panelSource).toContain("device until you send the message.");
    expect(panelSource).toContain("Snaps attach to the active thread.");
    expect(panelSource).toContain("capture stays pending until you open one.");
    expect(panelSource).toContain("await appSnap.setEnabled(false);");
    expect(panelSource).toContain('ariaLabel="Enable AppSnap"');
    expect(panelSource).toContain("onChange={setEnabled}");
    expect(panelSource).toContain("onClick={recheckPermissions}");
    expect(panelSource).toContain("onClick={previewCaptureSound}");
    expect(panelSource).toContain("onChange={setCaptureSound}");
    expect(panelSource).toContain("appSnap.setPlayCaptureSound(enabled)");
    expect(panelSource).toContain("previewCaptureSound()");
    expect(panelSource).not.toContain("SettingsAppSnapDisabledSwitch");
  });

  it("matches the Web hero and Capture row anatomy", () => {
    const styles = readFileSync(new URL("./settings-appsnap-panel.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.SettingsAppSnapHero\s*\{[^}]*min-height:\s*130px;[^}]*padding:\s*14px 16px;[^}]*gap:\s*12px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapIcon\s*\{[^}]*width:\s*32px;[^}]*height:\s*32px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapIconFrame\s*\{[^}]*width:\s*16px;[^}]*height:\s*12px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--muted-foreground\);[^}]*border-right-color:\s*var\(--muted-foreground\);[^}]*border-top-color:\s*var\(--muted-foreground\);[^}]*border-bottom-color:\s*var\(--muted-foreground\);/s,
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapIconCorner\s*\{[^}]*border-right-width:\s*1px;[^}]*border-right-style:\s*solid;[^}]*border-right-color:\s*var\(--muted-foreground\);[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--muted-foreground\);/s,
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapRow\s*\{[^}]*padding:\s*var\(--app-density-settings-row-padding-y,\s*10px\) 12px;[^}]*flex-direction:\s*column;/s,
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapMain\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*space-between;[^}]*gap:\s*20px;/s,
    );
    expect(styles).toMatch(/\.SettingsAppSnapRowCopy\s*\{[^}]*min-height:\s*40px;/s);
    expect(styles).toMatch(/\.SettingsAppSnapTitleLine\s*\{[^}]*min-height:\s*20px;/s);
    expect(styles).toMatch(/\.SettingsAppSnapMetadata\s*\{[^}]*padding-top:\s*4px;/s);
    expect(styles).toMatch(
      /\.SettingsAppSnapStatus\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapRow--continued\s*\{[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).not.toMatch(/\.SettingsAppSnapRow\s*\{[^}]*min-height:/s);
    expect(styles).not.toContain(".SettingsAppSnapDisabledSwitch");
    expect(styles).not.toContain("SettingsAppSnapRow--divided");
  });
});
