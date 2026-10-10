import assert from "node:assert/strict";
import { test } from "node:test";

import {
  HugeiconsGenerationError,
  generateHugeicons,
  readHugeiconAliases,
  runHugeiconsGenerator,
} from "./generate-hugeicons.mjs";

const SOURCE = `
import type { SVGProps } from "react";
import type { LucideIcon } from "./icons";
function createHugeicon(displayName: string, paths: readonly { d: string; round?: boolean }[], options: { strokeWidth?: number; solid?: boolean; mirror?: boolean } = {}): LucideIcon {
  const drawn = paths.map((path) => (
    <path key={path.d} d={path.d} {...(path.round ? { strokeLinecap: "round" } : {})} />
  ));
  function Hugeicon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" fill={options.solid ? "currentColor" : "none"} stroke="currentColor" strokeWidth={options.strokeWidth ?? 1.5} aria-hidden data-slot="hugeicon" {...props}>
        {options.mirror ? <g transform="translate(24 0) scale(-1 1)">{drawn}</g> : drawn}
      </svg>
    );
  }
  return Hugeicon;
}
export const Home07Icon = createHugeicon("Home07Icon", [{ d: "M1 2L3 4", round: true }]);
export const DotIcon = createHugeicon("DotIcon", [{ d: "M5 5" }], { solid: true, strokeWidth: 2, mirror: true });
`;
const ALIASES = `export { Home07Icon as HomeIcon, Home07Icon as DeviceHomeIcon } from "./hugeicons";\n`;

test("writes each icon's markup under the names icons.tsx exports", () => {
  const { text, names } = generateHugeicons({ sourceText: SOURCE, aliasSourceText: ALIASES });
  assert.deepEqual(names, ["DeviceHomeIcon", "DotIcon", "HomeIcon"]);
  assert.ok(
    text.includes(
      `  HomeIcon: ${JSON.stringify('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 2L3 4" stroke-linecap="round"/></svg>')},`,
    ),
  );
  // Options, and the mirror group, are upstream's; DOM-only attributes are dropped.
  assert.ok(
    text.includes(
      `  DotIcon: ${JSON.stringify('<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><g transform="translate(24 0) scale(-1 1)"><path d="M5 5"/></g></svg>')},`,
    ),
  );
  assert.doesNotMatch(text, /aria-hidden|data-slot/);
});

test("reads only the value re-exports from ./hugeicons", () => {
  const aliases = readHugeiconAliases(
    `export { A as B, C } from "./hugeicons";\nexport { D as E } from "./other";\n`,
  );
  assert.deepEqual(
    [...aliases],
    [
      ["A", ["B"]],
      ["C", ["C"]],
    ],
  );
});

test("refuses shapes it cannot write as markup", () => {
  assert.throws(
    () =>
      generateHugeicons({
        sourceText: `import { x } from "./runtime";\nexport const A = () => <svg>{x}</svg>;`,
        aliasSourceText: "",
      }),
    HugeiconsGenerationError,
  );
  assert.throws(
    () =>
      generateHugeicons({
        sourceText: `export const A = () => <svg><foreignObject /></svg>;`,
        aliasSourceText: "",
      }),
    /foreignObject/,
  );
  assert.throws(
    () => generateHugeicons({ sourceText: `export const SIZE = 24;`, aliasSourceText: "" }),
    /not an icon component/,
  );
  assert.throws(
    () =>
      generateHugeicons({
        sourceText: `export const A = () => <svg />;`,
        aliasSourceText: `export { Gone as B } from "./hugeicons";`,
      }),
    /does not export/,
  );
});

test("the committed file matches upstream's module", () => {
  const errors = [];
  const code = runHugeiconsGenerator({
    check: true,
    log: () => {},
    logError: (m) => errors.push(m),
  });
  assert.equal(code, 0, errors.join("\n"));
});
