# P5-R5 — Source reuse and visual regression gate

P5-R5 promotes the real Settings > Behavior route-owned panel from a compiler probe to the first
measured high-fidelity reference. The Web route still renders the same extracted composition, while
Rspeedy resolves only the two host-element leaves to Lynx implementations.

## Reuse result

`bun run --cwd apps/lynx audit:reuse` now accepts a screen-specific config, report title, interpretation and
target, resolves both Settings element adapters, and can fail `--check` when the gate is below the
configured threshold.

The generated `plan/reports/p5-r5-reference-reuse.{md,json}` result is:

- 8 eligible modules / 524 LOC;
- 6 SHARED modules / 468 LOC;
- 2 SPLIT host-element modules / 56 LOC;
- module reuse 75%, LOC reuse 89.31%;
- gate=min(module, LOC)=**75% ≥70%**.

The denominator is the complete route-owned panel graph. There are no exclusions, generated copies,
or unclassified modules.

## Visual result

Paired Web/Lynx evidence lives in
`shots/2026-07-27/port/p5-r5/settings-behavior/` at 1280×820 and 1440×900 native-window sizes.
Measurements are content-local because P6-C1 owns the surrounding shell/sidebar:

- maximum anchor delta: 1.75px;
- maximum measured size delta: 2.75px;
- corresponding font-size delta: 0px;
- row title/description line-height delta: 0px;
- switch geometry delta: 0px;
- no unregistered large-area color difference;
- Lynx DevTool warning/error console empty at both sizes.

The shared row adapter explicitly removes Web-only utility anatomy classes and supplies deterministic
host layout. During tuning, declarations containing `!important` disappeared from Lynx matched
styles without a build error; the adapter therefore uses role-specific classes and ordinary
specificity. This is recorded as P-26 and in the compat matrix.

## Reproduction notes

The isolated server on port 58090 already existed and was reused; only the temporary Web Vite
frontend and this task's Lynxtron PID were started/stopped. The unrelated Lynxtron client on 8902 was
not touched.

Lynxtron's CLI `--user-data-dir` argument does not change `app.getPath('userData')` in this runtime.
To obtain the second native size, the current `slice` window-state JSON was backed up, changed to
1440×900, verified with CoreGraphics and DevTool, then restored byte-for-byte. P-27 records this
visual-harness rule.

## Validation

- main repository `bun run build`: pass;
- Lynx `bun run --cwd apps/lynx build`: pass (612.2kB Lynx bundle, 727.2kB desktop total);
- focused `npm test -- src/main/desktop/shellRuntime.test.ts`: 3/3 pass;
- reference reuse generation + `--check`: pass at 75%;
- full style `--check`: pass at 96.29%;
- two-size Lynx DevTool screenshots and console inspection: pass.

Known build warnings remain the previously registered Lynx `color-scheme` / `text-transform`
encoder removals and optional `ws` native add-ons.
