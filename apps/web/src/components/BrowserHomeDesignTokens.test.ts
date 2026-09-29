import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("browser home design tokens", () => {
  it("shares the authority palette with Native instead of duplicating literals", () => {
    const tokens = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
    const browser = readFileSync(new URL("./BrowserPanel.tsx", import.meta.url), "utf8");
    const identity = readFileSync(new URL("./LocalServerIdentity.tsx", import.meta.url), "utf8");
    const consumers = browser + identity;

    for (const token of [
      "--browser-home-surface",
      "--browser-home-foreground",
      "--browser-home-foreground-secondary",
      "--browser-home-card-border",
      "--browser-home-thumbnail-surface",
      "--browser-home-online",
    ]) {
      expect(tokens).toContain(`${token}:`);
      expect(consumers).toContain(`var(${token})`);
    }
    expect(browser).not.toContain("bg-[#0d0d0d]");
    expect(browser).not.toContain("text-white/35");
    expect(browser).not.toContain("border-white/[0.07]");
  });
});
