import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";

import { HUGEICON_SVG } from "../../generated/hugeicons.generated";
import { hugeiconSvg } from "../../lib/hugeicons.lynx";
import { RAIL_CENTRAL_GLYPH_NAMES, RAIL_HUGEICON_GLYPH_NAMES } from "./AppRail.lynx";

const upstreamRail = readFileSync(
  new URL("../../../../web/src/components/AppRail.tsx", import.meta.url),
  "utf8",
);
const railSource = readFileSync(new URL("./AppRail.lynx.tsx", import.meta.url), "utf8");

/** `{ id: [idle, active] }` from upstream's `RAIL_HUGEICON_GLYPHS` table. */
function upstreamHugeiconGlyphs(): Record<string, readonly [string, string]> {
  const table = /const RAIL_HUGEICON_GLYPHS[^=]*=\s*\{([\s\S]*?)\n\};/.exec(upstreamRail)?.[1];
  if (!table) throw new Error("RAIL_HUGEICON_GLYPHS not found in upstream's AppRail.tsx");
  const glyphs: Record<string, readonly [string, string]> = {};
  for (const [, id, icon] of table.matchAll(/(\w+): sameGlyphs\((\w+)\)/g)) {
    glyphs[id!] = [icon!, icon!];
  }
  for (const [, id, idle, active] of table.matchAll(/(\w+): \{ idle: (\w+), active: (\w+) \}/g)) {
    glyphs[id!] = [idle!, active!];
  }
  return glyphs;
}

describe("app rail glyphs", () => {
  it("names the same Hugeicon as upstream for every rail item, at rest and active", () => {
    const upstream = upstreamHugeiconGlyphs();
    expect(Object.keys(upstream).length).toBeGreaterThan(0);
    expect(
      Object.fromEntries(
        Object.entries(RAIL_HUGEICON_GLYPH_NAMES).map(([id, glyph]) => [
          id,
          [glyph.idle, glyph.active],
        ]),
      ),
    ).toEqual(upstream);
  });

  it("names upstream's Central icons for Kanban, Settings and More", () => {
    expect(upstreamRail).toContain(`kanban: "${RAIL_CENTRAL_GLYPH_NAMES.kanban}"`);
    expect(upstreamRail).toContain(`settings: "${RAIL_CENTRAL_GLYPH_NAMES.settings}"`);
    expect(upstreamRail).toContain(`railCentralGlyphs("${RAIL_CENTRAL_GLYPH_NAMES.more}")`);
    // Outline at rest, the fill set while active (upstream `railCentralGlyphs`).
    for (const name of Object.values(RAIL_CENTRAL_GLYPH_NAMES)) {
      expect(railSource).toContain(`"@synara-central-icons/${name}.svg?raw"`);
      expect(railSource).toContain(`"@synara-central-icons-fill/${name}.svg?raw"`);
    }
  });

  it("draws them from upstream's paths, not the Tabler stand-ins", () => {
    expect(railSource).not.toContain('"../../lib/icons.lynx"');
    expect(railSource).not.toContain("PullRequestCompareIcon");
    // Home07Icon's roof, and the solid hub: upstream's own drawings and options.
    expect(HUGEICON_SVG.HomeIcon).toContain('stroke-width="1.5"');
    expect(HUGEICON_SVG.HomeIcon).toContain('viewBox="0 0 24 24"');
    expect(HUGEICON_SVG.HubActiveIcon).toContain('fill="currentColor"');
    expect(HUGEICON_SVG.HubIcon).toContain('fill="none"');
    expect(hugeiconSvg("HomeIcon", 2)).toContain('stroke-width="2"');
    expect(hugeiconSvg("HomeIcon", 2)).not.toContain('stroke-width="1.5"');
  });
});
