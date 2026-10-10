import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@rstest/core";

import { WEB_HOST_STYLE_OVERRIDES, webHostStyleOverrideRules } from "./webHostStyleOverrides.logic";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** The declarations of every rule in `css` whose selector list contains `selector`. */
function sharedRuleDeclarations(css: string, selector: string): Record<string, string>[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: Record<string, string>[] = [];
  for (const match of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1]!.split(",").map((entry) => entry.trim().replace(/\s+/g, " "));
    if (!selectors.includes(selector)) continue;
    rules.push(
      Object.fromEntries(
        match[2]!
          .split(";")
          .map((declaration) => declaration.split(":").map((part) => part.trim()))
          .filter((parts) => parts.length === 2 && parts[0] !== "")
          .map(([property, value]) => [property!, value!]),
      ),
    );
  }
  return rules;
}

describe("Lynx-for-Web style overrides", () => {
  it("overrides only rules the shared stylesheets still contain", () => {
    for (const override of WEB_HOST_STYLE_OVERRIDES) {
      const css = readFileSync(path.join(sourceRoot, override.source), "utf8");
      for (const selector of override.selectors) {
        expect(
          css.replace(/\s+/g, " ").includes(selector),
          `${override.source} no longer has ${selector}`,
        ).toBe(true);
      }
    }
  });

  it("changes a value the shared rule sets: an override equal to it is dead", () => {
    for (const override of WEB_HOST_STYLE_OVERRIDES) {
      if (override.kind !== "text-metrics") continue;
      const css = readFileSync(path.join(sourceRoot, override.source), "utf8");
      // The rule that carries the Native correction declares every overridden property;
      // a selector may have other rules that do not.
      const corrected = override.selectors
        .flatMap((selector) => sharedRuleDeclarations(css, selector))
        .find((declarations) =>
          Object.keys(override.declarations).every((property) => declarations[property]),
        );
      expect(corrected, `${override.selectors.join(", ")} in ${override.source}`).toBeTruthy();
      for (const [property, value] of Object.entries(override.declarations)) {
        expect(corrected![property], `${override.selectors[0]} ${property}`).not.toBe(value);
      }
    }
  });

  it("gives every override a reason", () => {
    for (const override of WEB_HOST_STYLE_OVERRIDES) {
      expect(override.reason.length).toBeGreaterThan(20);
    }
  });

  it("emits one important rule per override, scoped where asked", () => {
    expect(
      webHostStyleOverrideRules([
        {
          kind: "chrome",
          source: "a.css",
          selectors: [".A .B", ".C"],
          within: ".Root:has(.Closed)",
          declarations: { "margin-left": "57px", left: "0" },
          reason: "example",
        },
      ]),
    ).toEqual([
      ".Root:has(.Closed) .A .B, .Root:has(.Closed) .C { margin-left: 57px !important; left: 0 !important; }",
    ]);
    expect(webHostStyleOverrideRules()).toHaveLength(WEB_HOST_STYLE_OVERRIDES.length);
  });
});
