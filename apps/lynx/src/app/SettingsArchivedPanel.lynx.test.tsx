import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Settings Archived fidelity", () => {
  it("restores the exact archived row after its native context menu closes", () => {
    const source = readFileSync(
      new URL("./SettingsArchivedPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("() => focusLynxNode(rowRef)");
    expect(source).toContain("{ restoreFocus }");
  });

  it("routes a real archived panel backed by the shell snapshot", () => {
    const settingsSource = readFileSync(new URL("./SettingsPage.tsx", import.meta.url), "utf8");
    const queriesSource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
    const panelSource = readFileSync(
      new URL("./SettingsArchivedPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(settingsSource).toContain("'archived',");
    expect(settingsSource).toContain("section === 'archived'");
    expect(settingsSource).toContain("<SettingsArchivedPanel />");
    expect(queriesSource).toContain("readonly archivedAt?: string | null;");
    expect(queriesSource).toContain("readonly archivedThreads:");
    expect(queriesSource).toContain("createThreadShellsSelector()(normalized)");
    expect(panelSource).toContain("queryKey: ['sidebar-snapshot']");
    expect(panelSource).toContain("snapshotQuery.data?.archivedThreads");
    expect(panelSource).toContain("No archived threads");
    expect(panelSource).toContain(
      'accessibility-label="No archived threads. Archived threads will appear here and can be restored to the sidebar."',
    );
    expect(panelSource).toContain(
      "Archived threads will appear here and can be restored to the sidebar.",
    );
    expect(panelSource).toContain("import { ArchiveIcon } from '../lib/icons.lynx';");
    expect(panelSource).toContain('className="SettingsArchivedEmptyIcon"');
    expect(panelSource).not.toContain("function ArchiveIcon()");
  });

  it("wires restore and confirmed delete through canonical commands", () => {
    const panelSource = readFileSync(
      new URL("./SettingsArchivedPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const logicSource = readFileSync(
      new URL("./settingsArchived.logic.ts", import.meta.url),
      "utf8",
    );

    expect(panelSource).toContain("dispatchSynaraCommand(");
    expect(panelSource).toContain("createUnarchiveCommand({");
    expect(panelSource).toContain("createDeleteArchivedThreadCommand({");
    expect(panelSource).toContain("await dialogs.confirm(");
    expect(panelSource).toContain(
      "This will remove the thread and its conversation history forever.",
    );
    expect(panelSource).toContain(
      "queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] })",
    );
    expect(panelSource).toContain("Restore ${thread.title}");
    expect(panelSource).toContain("Delete ${thread.title}");
    expect(panelSource).toContain('variant="destructive"');
    expect(panelSource).toContain("buildArchivedThreadContextMenuItems()");
    expect(panelSource).toContain("resolveSecondaryPointerOffset(event)");
    expect(panelSource).toContain("getRectByRef(rowRef, true)");
    expect(panelSource).toContain("bindlongpress=");
    expect(panelSource).toContain("action === 'restore'");
    expect(panelSource).toContain("action === 'delete'");
    expect(logicSource).toContain("type: 'thread.delete' as const");
  });

  it("matches the Web empty-state and list-row anatomy", () => {
    const styles = readFileSync(new URL("./settings-archived-panel.css", import.meta.url), "utf8");
    const primitiveStyles = readFileSync(
      new URL("../components/ui/primitives.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /\.SettingsArchivedEmpty,[^}]*\.SettingsArchivedState\s*\{[^}]*padding:\s*40px 20px;[^}]*border-width:\s*1px;[^}]*border-style:\s*dashed;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-radius:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsArchivedEmptyIconShell\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-radius:\s*22px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsArchivedEmptyTitle,\s*\.SettingsArchivedEmptyDescription\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsArchivedRow\s*\{[^}]*justify-content:\s*space-between;[^}]*gap:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsArchivedRowActions\s*\{[^}]*flex-shrink:\s*0;[^}]*gap:\s*8px;/s,
    );
    expect(styles).not.toMatch(/\.SettingsArchivedRow\s*\{[^}]*min-height:/s);
    expect(styles).toMatch(/\.SettingsArchivedRestoreError\s*\{[^}]*border-radius:\s*10px;/s);
    expect(styles).not.toContain("var(--radius-lg)");
    expect(primitiveStyles).toMatch(
      /\.LxButton--xs\s*\{[^}]*height:\s*24px;[^}]*padding-left:\s*7px;[^}]*padding-right:\s*7px;[^}]*padding-top:\s*0;[^}]*padding-bottom:\s*0;[^}]*gap:\s*4px;/s,
    );
    expect(primitiveStyles).toMatch(
      /\.LxButton--xs \.LxButton__text\s*\{[^}]*font-size:\s*10px;[^}]*line-height:\s*15px;/s,
    );
  });
});
