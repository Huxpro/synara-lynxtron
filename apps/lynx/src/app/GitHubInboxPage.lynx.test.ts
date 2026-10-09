import { beforeEach, describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import { APP_SETTINGS_STORAGE_KEY } from "@synara-web/appSettingsStorageProjection.logic";
import { webStorage } from "../platform/storage";
import { readGitHubInboxSettings, writeGitHubInboxSettings } from "./githubInboxSettings.lynx";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("Code review page (upstream GitHub inbox)", () => {
  it("is the /pull-requests route and the rail's Code review destination", () => {
    const router = read("./router.tsx");
    const rail = read("../components/sidebar/AppRail.lynx.tsx");

    expect(router).toContain("page = <GitHubInboxPage />;");
    expect(router).not.toContain("PullRequestsPage");
    expect(rail).toContain('pullRequests: "/pull-requests"');
  });

  it("names the regions and controls as upstream does", () => {
    const page = read("./GitHubInboxPage.lynx.tsx");
    const bar = read("./GitHubInboxFilterBar.lynx.tsx");

    for (const label of ["Code review list", "Item details", "Resize code review list"]) {
      expect(page).toContain(`accessibility-label="${label}"`);
    }
    expect(bar).toContain("ariaLabel={`Sort: ${sortLabel}`}");
    expect(bar).toContain('menuFilterCount > 0 ? `Filter (${menuFilterCount} active)` : "Filter"');
    expect(bar).toContain('ariaLabel="More code review actions"');
    expect(bar).toContain('accessibleLabel="Search pull requests and issues"');
    expect(bar).toContain('placeholder="Search or paste a PR link"');
    expect(bar).toContain('accessibility-label="Kind"');
    expect(bar).toContain("`${props.tab.label}, ${props.count}`");
    expect(bar).toContain("`Remove filter: ${props.label}`");
  });

  it("derives filters, rows, counts and notes from upstream's inbox logic", () => {
    const page = read("./GitHubInboxPage.lynx.tsx");

    for (const helper of [
      "resolveGitHubInboxFilters(search, settings, existingProjectIds)",
      "selectVisibleInboxItems(",
      "groupVisibleInboxItems(entries)",
      "countInboxItemsByKind(",
      "collectInboxLabelOptions(",
      "countTruncatedInboxRepositories(",
      "inboxErrorsInScope(",
      "resolveInboxItemReference(",
      "githubInboxSelectionForItem(item)",
      "updateSettings(CLEARED_GITHUB_INBOX_FILTER_SETTINGS)",
    ]) {
      expect(page).toContain(helper);
    }
    expect(page).toContain("`No ${noun} found`");
  });

  it("shows the unported agent actions as unavailable instead of faking them", () => {
    const unavailable = read("./GitHubItemAgentUnavailable.lynx.tsx");

    expect(unavailable).toContain("Send to agent and Ask are not available in the Native app yet.");
    expect(unavailable).toMatch(
      /<Button size="sm" variant="outline" disabled aria-label="Send to agent">/,
    );
    expect(read("./PullRequestDetailPane.lynx.tsx")).toContain(
      '<GitHubItemAgentUnavailable noun="pull request" />',
    );
    expect(read("./GitHubIssueDetailPane.lynx.tsx")).toContain(
      '<GitHubItemAgentUnavailable noun="issue" />',
    );
  });

  it("lays the list column out on upstream's fractions", () => {
    const styles = read("./github-inbox.css");

    expect(styles).toMatch(
      /\.GitHubInboxList\s*\{[^}]*width:\s*32%;[^}]*min-width:\s*256px;[^}]*max-width:\s*416px;/s,
    );
    expect(styles).toMatch(/\.GitHubInboxTopStrip\s*\{[^}]*height:\s*44px;/s);
    expect(styles).toMatch(
      /\.GitHubInboxResizeHandle\s*\{[^}]*right:\s*-4px;[^}]*width:\s*8px;[^}]*height:\s*100%;/s,
    );
    expect(styles).toMatch(/\.GitHubInboxKindTab\s*\{[^}]*height:\s*20px;[^}]*padding:\s*0 6px;/s);
    expect(styles).toMatch(/\.GitHubInboxDetail\s*\{[^}]*padding:\s*8px 12px 0;/s);
    // Narrow windows show the list or the detail.
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.GitHubInboxBody--detail-open \.GitHubInboxList\s*\{[^}]*display:\s*none;/s,
    );
  });
});

describe("Code review settings", () => {
  beforeEach(() => {
    webStorage.removeItem(APP_SETTINGS_STORAGE_KEY);
  });

  it("reads upstream's defaults from an empty or unreadable record", () => {
    const defaults = {
      githubInboxKind: "all",
      githubInboxState: "open",
      githubInboxSort: "created",
      githubInboxInvolvement: "everything",
      githubInboxProjectIds: [],
      githubInboxLabels: [],
      githubInboxExpandedSections: undefined,
      timestampFormat: "locale",
    };
    expect(readGitHubInboxSettings()).toEqual(defaults);
    webStorage.setItem(APP_SETTINGS_STORAGE_KEY, "{not json");
    expect(readGitHubInboxSettings()).toEqual(defaults);
    webStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify({ githubInboxKind: "bogus" }));
    expect(readGitHubInboxSettings().githubInboxKind).toBe("all");
  });

  it("merges a change into the record and keeps keys this build does not know", () => {
    webStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({ futureElectronSetting: { nested: true }, githubInboxSort: "updated" }),
    );

    writeGitHubInboxSettings({ githubInboxKind: "issue", githubInboxLabels: ["bug"] });

    expect(JSON.parse(webStorage.getItem(APP_SETTINGS_STORAGE_KEY)!)).toEqual({
      futureElectronSetting: { nested: true },
      githubInboxSort: "updated",
      githubInboxKind: "issue",
      githubInboxLabels: ["bug"],
    });
    expect(readGitHubInboxSettings()).toMatchObject({
      githubInboxKind: "issue",
      githubInboxSort: "updated",
      githubInboxLabels: ["bug"],
    });
  });
});
