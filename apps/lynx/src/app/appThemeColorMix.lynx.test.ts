import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";
import {
  buildThemeCssVariables,
  DEFAULT_THEME_STATE,
  normalizeThemeState,
  resolveThemePack,
  updateChromeTheme,
  type ThemeState,
  type ThemeVariant,
} from "@synara-web/theme/theme.logic";

import { buildColorMixCss, colorMixTokenName } from "../../scripts/color-mix.logic.mjs";
import { parseCssColor } from "../../scripts/css-color.logic.mjs";
import {
  collectColorMixInputs,
  colorMixRuntimeText,
} from "../../scripts/generate-color-mix-tokens.mjs";
import manifest from "../generated/nativeColorMix.generated.json";
import {
  evaluateSliceColorMixVariables,
  resolveSliceColorMixVariables,
  resolveSliceThemeVariables,
} from "./appTheme.logic";

const VARIANTS: readonly ThemeVariant[] = ["light", "dark"];
const read = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");
const token = (expression: string) => colorMixTokenName(expression);

function upstreamVariables(state: ThemeState, variant: ThemeVariant) {
  return buildThemeCssVariables(resolveThemePack(state, variant), variant, {
    electron: false,
    isMac: true,
    systemUiFont: state.systemUiFont,
  }).variables;
}

/** `name: value;` declarations of one theme block of the generated stylesheet. */
function generatedBlock(variant: ThemeVariant): Record<string, string> {
  const css = read("../generated/native-color-mix-variables.css");
  const start = css.indexOf(`.SliceRoot--theme-${variant} {`);
  const block = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries(
    [...block.matchAll(/^ {2}(--[\w-]+): ([^;]+);$/gm)].map((match) => [match[1]!, match[2]!]),
  );
}

describe("runtime colour-mix tokens", () => {
  it("keeps the runtime manifest in sync with the generator", () => {
    // Stale? Run `node scripts/generate-color-mix-tokens.mjs` in apps/lynx.
    const result = buildColorMixCss(collectColorMixInputs());
    expect(read("../generated/nativeColorMix.generated.json")).toBe(colorMixRuntimeText(result));
  });

  it("evaluates the default pack to the generated stylesheet, token by token", () => {
    for (const variant of VARIANTS) {
      const generated = generatedBlock(variant);
      const evaluated = evaluateSliceColorMixVariables(
        variant,
        upstreamVariables(DEFAULT_THEME_STATE, variant),
      );
      expect(Object.keys(generated).length).toBeGreaterThan(80);
      expect(Object.keys(evaluated).toSorted()).toEqual(Object.keys(generated).toSorted());
      for (const [name, value] of Object.entries(generated)) {
        expect(evaluated[name], `${variant} ${name}`).toBe(value);
      }
      // The default pack takes the generator's values without evaluating.
      expect(manifest.defaults[variant]).toEqual(generated);
      expect(
        resolveSliceColorMixVariables(
          resolveThemePack(DEFAULT_THEME_STATE, variant),
          variant,
          upstreamVariables(DEFAULT_THEME_STATE, variant),
        ),
      ).toBe(manifest.defaults[variant]);
    }
  });

  it("follows a changed accent in the accent-derived tokens and only there", () => {
    const focusRing = "--control-focus-ring-color";
    const accentTint = token("color-mix(in srgb, var(--color-text-accent) 16%, transparent)");
    const divider = "--app-surface-divider";
    for (const variant of VARIANTS) {
      const base = resolveSliceThemeVariables({ ...DEFAULT_THEME_STATE, mode: variant });
      const edited = resolveSliceThemeVariables(
        updateChromeTheme({ ...DEFAULT_THEME_STATE, mode: variant }, variant, {
          accent: "#00aa55",
        }),
      );
      const editedUpstream = upstreamVariables(
        updateChromeTheme(DEFAULT_THEME_STATE, variant, { accent: "#00aa55" }),
        variant,
      );
      expect(base[focusRing]).toBe(manifest.defaults[variant][focusRing]);
      expect(edited[focusRing]).not.toBe(base[focusRing]);
      expect(edited[accentTint]).not.toBe(base[accentTint]);
      expect(edited[divider]).toBe(base[divider]);
      // The same key set whatever the pack: the root inline map never drops a name.
      expect(Object.keys(edited).toSorted()).toEqual(Object.keys(base).toSorted());
      // --color-border-focus and --color-text-accent are concrete in upstream's table;
      // the mix with `transparent` keeps their channels and scales alpha.
      const channels = (value: string) => {
        const color = parseCssColor(value)!;
        return [color.r, color.g, color.b].map(Math.round);
      };
      expect(channels(edited[focusRing]!)).toEqual(
        channels(editedUpstream["--color-border-focus"]!),
      );
    }
  });

  it("gives the stored bare-mode theme (the Codex pack) Codex-blue derived tokens", () => {
    const light = resolveSliceThemeVariables(normalizeThemeState({ mode: "light" }));
    const dark = resolveSliceThemeVariables(normalizeThemeState({ mode: "dark" }));
    // The values App.css used to hard-code for every pack.
    expect(light["--control-focus-ring-color"]).toBe("rgba(1, 105, 204, 0.6)");
    expect(light[token("color-mix(in srgb, var(--color-text-accent) 15%, transparent)")]).toBe(
      "rgba(1, 105, 204, 0.15)",
    );
    expect(dark[token("color-mix(in srgb, var(--color-text-accent) 15%, transparent)")]).toBe(
      "rgba(51, 134, 214, 0.15)",
    );
    expect(light[token("color-mix(in srgb, var(--info) 24%, transparent)")]).toBe(
      "rgba(1, 105, 204, 0.24)",
    );
  });

  it("supplies the values upstream leaves as color-mix() in its table", () => {
    for (const variant of VARIANTS) {
      const state = normalizeThemeState({ mode: variant });
      const upstream = upstreamVariables(state, variant);
      const resolved = resolveSliceThemeVariables(state);
      const mixed = Object.keys(upstream).filter((name) => upstream[name]!.includes("color-mix("));
      expect(mixed.length).toBeGreaterThan(0);
      for (const name of mixed) expect(resolved[name], name).toMatch(/^rgba\(/);
      expect(Object.values(resolved).filter((value) => value.includes("var("))).toEqual([]);
    }
  });

  it("no longer hard-codes the Codex accent in the stylesheets", () => {
    for (const path of [
      "./App.css",
      "./settings-profile-panel.css",
      "../components/provider-health-banner.css",
      "../components/sidebar/sidebar-surface-header.css",
    ]) {
      expect(read(path), path).not.toMatch(/1, 105, 204|51, 134, 214|#0169cc/i);
    }
    expect(read("./App.css")).not.toContain("--control-focus-ring-color:");
  });

  it("keeps the evaluator free of Node built-ins", () => {
    for (const path of [
      "../../scripts/color-mix-eval.logic.mjs",
      "../../scripts/css-color.logic.mjs",
    ]) {
      const source = read(path);
      expect(source, path).not.toMatch(/from\s+["']node:|require\(/);
      const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
      expect(imports.every((specifier) => specifier === "./css-color.logic.mjs")).toBe(true);
    }
  });
});
