import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import { providerUpdatePromptCopy } from "./ProviderUpdatePrompt.lynx";

describe("Lynx provider update prompt copy", () => {
  it("matches the expanded Web notification anatomy", () => {
    const source = readFileSync(
      new URL("./ProviderUpdatePrompt.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(source).toContain("<TriangleAlertIcon");
    expect(source).toContain('className="ProviderUpdatePromptContent"');
    expect(source).toContain('className="ProviderUpdatePromptActions"');
    expect(source).toContain('className="ProviderUpdatePromptDismiss"');
    expect(source).toContain("export function ProviderUpdatePromptSurface");
    expect(source).toContain("<ProviderUpdatePromptSurface");
    expect(source).toContain("<CircleAlertIcon");
    expect(source).toContain(") : updating ? (");
    expect(source).toContain(") : failed ? (");
    expect(source).toContain("Review providers");
    expect(source).toContain("Copy");
    expect(styles).toMatch(
      /\.ProviderUpdatePromptIcon--updating\s*\{[^}]*animation:\s*ProviderUpdatePromptSpin 900ms linear infinite;/s,
    );
    expect(source).toContain("runProviderUpdateBatch({");
    expect(source).toContain("providerUpdateOutcomeCopy(outcome)");
    expect(source).toContain("useQuery(serverConfigQueryOptions())");
    expect(source).toContain("useQuery(serverSettingsQueryOptions())");
    expect(source).not.toContain("queryKey: ['provider-update-prompt']");
    expect(source).toContain("PROVIDER_UPDATE_INITIAL_REFRESH_DELAY_MS");
    expect(source).toContain("PROVIDER_UPDATE_REFRESH_INTERVAL_MS");
    expect(source).toContain("refreshServerProviderStatuses(queryClient)");
    // The refresh reconciles into the config query Settings reads; no second cache.
    expect(source).toContain("const config = useQuery(serverConfigQueryOptions());");
    expect(source).not.toContain("queryClient.setQueryData(");
    expect(source).toContain('activeOutcome?.status === "succeeded"');
    expect(source).toContain("Copy");
    expect(source).toContain("Review providers");
    expect(source).toContain("Updating…");
    expect(source).not.toContain("Promise.allSettled");
    expect(styles).toMatch(
      /\.ProviderUpdatePrompt\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*122px;[^}]*border-radius:\s*18px;/s,
    );
    expect(styles).toMatch(
      /\.ProviderUpdatePromptTitle\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-lg, 14px\);[^}]*font-weight:\s*400;[^}]*line-height:\s*20px;/s,
    );
    expect(styles).toMatch(/\.ProviderUpdatePromptContent\s*\{[^}]*height:\s*96px;/s);
    expect(styles).toMatch(/\.ProviderUpdatePromptCopy\s*\{[^}]*height:\s*62px;[^}]*gap:\s*2px;/s);
    expect(styles).toMatch(
      /\.ProviderUpdatePromptActions\s*\{[^}]*height:\s*24px;[^}]*margin-top:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.ProviderUpdatePromptAction \+ \.ProviderUpdatePromptAction\s*\{[^}]*margin-left:\s*6px;/s,
    );
    expect(styles).not.toContain(".ProviderUpdatePrompt--failure {");
    expect(styles).not.toContain(".ProviderUpdatePrompt--failure .ProviderUpdatePromptDescription");
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.ProviderUpdatePrompt\s*\{[^}]*min-height:\s*126px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.ProviderUpdatePromptAction\s*\{[^}]*height:\s*28px;[^}]*min-height:\s*28px;/s,
    );
  });

  it("matches the Web single-provider prompt", () => {
    expect(
      providerUpdatePromptCopy({
        firstProviderName: "Claude",
        providerCount: 1,
        updateFailed: false,
      }),
    ).toEqual({
      title: "Claude update available",
      description: "Claude has a newer version available.",
    });
  });

  it("matches the Web multi-provider prompt", () => {
    expect(
      providerUpdatePromptCopy({
        firstProviderName: "Claude",
        providerCount: 3,
        updateFailed: false,
      }),
    ).toEqual({
      title: "3 provider updates available",
      description: "Claude and 2 more providers have newer versions available.",
    });
  });

  it("matches the Web two-provider singular suffix", () => {
    expect(
      providerUpdatePromptCopy({
        firstProviderName: "Claude",
        providerCount: 2,
        updateFailed: false,
      }),
    ).toEqual({
      title: "2 provider updates available",
      description: "Claude and 1 more provider have newer versions available.",
    });
  });

  it("retains the prompt after a failed update-all request", () => {
    expect(
      providerUpdatePromptCopy({
        firstProviderName: "Claude",
        providerCount: 3,
        updateFailed: true,
      }),
    ).toEqual({
      title: "3 provider updates available",
      description: "One or more provider updates failed. Review provider tools for details.",
    });
  });
});
