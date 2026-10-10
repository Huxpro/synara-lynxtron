import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Pull Request primary action layout fidelity", () => {
  it("keeps the primary action in the 48px header cluster", () => {
    const source = readFileSync(
      new URL("./PullRequestDetailPane.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(source).toContain('className="SharedPrDetailDockActions"');
    expect(source).toContain('className="SharedPrHeaderPrimaryAction"');
    expect(source).not.toContain('className="SharedPrActionBar"');
    expect(styles).toMatch(
      /\.SharedPrDetailDockActions\s*\{[^}]*margin-left:\s*auto;[^}]*display:\s*flex;[^}]*gap:\s*4px;/s,
    );
    expect(styles).toMatch(
      /\.SharedPrHeaderPrimaryAction\s*\{[^}]*min-height:\s*28px;[^}]*height:\s*28px;[^}]*padding:\s*0 12px;[^}]*border-radius:\s*8px;/s,
    );
    expect(styles).toMatch(
      /\.SharedPrHeaderPrimaryAction \.LxButton__text\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-sm, 12px\);[^}]*line-height:\s*18px;[^}]*font-weight:\s*400;/s,
    );
    expect(styles).not.toMatch(/\.SharedPrActionBar\s*\{/);
  });

  it("retains failed-action recovery as a conditional inline status", () => {
    const source = readFileSync(
      new URL("./PullRequestDetailPane.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(source).toContain("{lastFailedAction ? (");
    expect(source).toContain('className="SharedPrActionRecovery"');
    expect(source).toContain("onClick={() => runPullRequestAction(lastFailedAction)}");
    expect(styles).toMatch(
      /\.SharedPrActionRecovery\s*\{[^}]*padding:\s*8px 20px;[^}]*border-bottom:\s*1px solid var\(--border\);/s,
    );
  });
});
