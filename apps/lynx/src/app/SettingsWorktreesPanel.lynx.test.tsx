import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Settings Worktrees fidelity", () => {
  it("routes the real Worktrees section and canonical RPCs", () => {
    const settingsSource = readFileSync(new URL("./SettingsPage.tsx", import.meta.url), "utf8");
    const clientSource = readFileSync(
      new URL("../data/synaraClient.lynx.ts", import.meta.url),
      "utf8",
    );
    const queriesSource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
    const panelSource = readFileSync(
      new URL("./SettingsWorktreesPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(settingsSource).toContain('"worktrees",');
    expect(settingsSource).toContain('section === "worktrees"');
    expect(settingsSource).toContain("<SettingsWorktreesPanel />");
    expect(clientSource).toContain('"server.listWorktrees"');
    expect(clientSource).toContain('"git.removeWorktree"');
    expect(queriesSource).toContain("readonly workspaceThreads:");
    expect(queriesSource).toContain("associatedWorktreePath:");
    expect(panelSource).toContain('queryKey: ["managed-worktrees"]');
    expect(panelSource).toContain("No app-managed worktrees found yet.");
    expect(panelSource).toContain("No conversations linked to this worktree.");
    expect(panelSource).toMatch(
      /<view className="SettingsWorktreesConversationList">\s*<text className="SettingsWorktreesRowDescription">\s*No conversations linked to this worktree\./s,
    );
  });

  it("uses host confirmation and the canonical destructive transaction", () => {
    const panelSource = readFileSync(
      new URL("./SettingsWorktreesPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(panelSource).toContain("const snapshot = await readFreshSidebarSnapshot()");
    expect(panelSource).not.toContain("await readSidebarSnapshot()");
    expect(panelSource).toContain("linkedThreadsForWorktree(snapshot.workspaceThreads, input.path");
    expect(panelSource).toContain(
      "Could not verify linked conversations. Retry once the app reconnects to the server.",
    );
    expect(panelSource).toContain("await dialogs.confirm(");
    expect(panelSource).toContain("createDeleteThreadCommand({");
    expect(panelSource).toContain("if (thread.archivedAt == null) continue;");
    expect(panelSource).toContain("await removeManagedWorktree({");
    expect(panelSource).toContain("force: true");
    expect(panelSource).toContain(
      'queryClient.invalidateQueries({ queryKey: ["managed-worktrees"] })',
    );
    // Linked conversations come from the shared store; nothing to invalidate.
    expect(panelSource).not.toContain('queryKey: ["sidebar-snapshot"]');
  });

  it("matches the Web grouped-row and status anatomy", () => {
    const styles = readFileSync(new URL("./settings-worktrees-panel.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.SettingsWorktreesState\s*\{[^}]*padding:\s*24px 16px;[^}]*border-width:\s*1px;[^}]*border-style:\s*dashed;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.SettingsWorktreesState--error,\s*\.SettingsWorktreesDeleteError\s*\{[^}]*border-left-color:\s*var\(--destructive\);[^}]*border-right-color:\s*var\(--destructive\);[^}]*border-top-color:\s*var\(--destructive\);[^}]*border-bottom-color:\s*var\(--destructive\);/s,
    );
    expect(styles).not.toMatch(/\.SettingsWorktreesState\s*\{[^}]*min-height:/s);
    expect(styles).toMatch(
      /\.SettingsWorktreesStateText\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsWorktreesRow\s*\{[^}]*align-items:\s*flex-start;[^}]*justify-content:\s*space-between;[^}]*gap:\s*10px;/s,
    );
    expect(styles).not.toMatch(/\.SettingsWorktreesRow\s*\{[^}]*min-height:/s);
    expect(styles).toMatch(
      /\.SettingsWorktreesActions\s*\{[^}]*flex-shrink:\s*0;[^}]*align-items:\s*flex-end;/s,
    );
    expect(styles).toMatch(/\.SettingsWorktreesActionHint\s*\{[^}]*width:\s*160px;/s);
    expect(styles).toMatch(
      /\.SettingsWorktreesConversationLabel\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*18px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsWorktreesPath\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
    );
    expect(styles).toMatch(
      /\.SettingsWorktreesConversation\s*\{[^}]*font-size:\s*var\(--type-settings-row-description-size\);[^}]*font-weight:\s*400;[^}]*line-height:\s*var\(--type-settings-row-description-line-height\);/s,
    );
  });
});
