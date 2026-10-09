# Lynx config flag experiments

Date: 2026-08-18.

## Objective

Test three `@lynx-js/type-config@4.1.1` flags against previously registered
Lynxtron Desktop gaps:

- `enableCSSInlineVariables` against P-45 inline root custom properties;
- `enableCSSRule` against dropped `@media` / `@supports` rules;
- `enableNewTransformOrigin` against 14px rotation-anchor drift.

Each config state was built and launched independently. The probe was selected
through an experiment-only entry, never added to product navigation, and is
removed from the retained source after evidence capture.

## Environment and ownership

- macOS arm64;
- `@lynx-js/lynxtron@0.0.12-dev`;
- DevTool-reported Lynx SDK `4.2`;
- `@lynx-js/type-config@4.1.1`;
- `@lynx-js/react-rsbuild-plugin@0.18.1`;
- production build with `SYNARA_ENABLE_DEVTOOL=1`;
- isolated user-data directory per round;
- parallel-instance mode and background presentation;
- PID-derived DevTool client only;
- unrelated `another-project` and iOS LynxExplorer clients were not reused or
  stopped.

All seven retained rounds proved that
`output/bundle/lynx/main.lynx.bundle` and
`dist/desktop/main.lynx.bundle` were byte-identical before launch. Every
initial/toggled frame was `2200x1800` for a logical `1100x900` viewport at DPR 2. CSS-rule resize frames were `1800x1800` for logical `900x900`.

The complete machine-readable record is `results.json`. It includes the
per-round bundle SHA-256, computed styles, transform quads, viewport
dimensions, and console byte counts.

Each stored warning/error console file contained only one trailing newline
byte, i.e. zero DevTool warning/error messages.

## Result 1: `enableCSSInlineVariables`

Contact sheet: `enableCSSInlineVariables/off-on.png`.

Quadrants:

- top-left: flag `false`, initial inline value requests red;
- top-right: flag `false`, real tap changes the requested value to blue;
- bottom-left: flag `true`, initial inline value requests red;
- bottom-right: flag `true`, real tap changes the requested value to blue.

Computed descendant backgrounds:

| State   | Initial                          | After real tap   |
| ------- | -------------------------------- | ---------------- |
| `false` | `rgb(22,163,74)` (`:root` green) | `rgb(22,163,74)` |
| `true`  | `rgb(239,68,68)`                 | `rgb(37,99,235)` |

Conclusion: the Desktop engine does implement the flag. It fixes both initial
inline custom-property resolution and runtime descendant re-evaluation.

The stylesheet class override is independent of this flag. In both flag
states, toggling the class changed the descendant from
`rgb(22,163,74)` to `rgb(126,34,206)`. P-45's older class-scoped negative
result is therefore stale for the current `0.0.12-dev` runtime.

## Result 2: `enableCSSRule`

Contact sheet: `enableCSSRule/off-on-resize.png`.

Quadrants:

- top-left: flag `false`, `1100px`;
- top-right: flag `false`, after a real product-host resize to `900px`;
- bottom-left: flag `true`, `1100px`;
- bottom-right: flag `true`, after the same real resize to `900px`.

Computed backgrounds:

| Rule                          | `false` | `true`, 1100px   | `true`, 900px    |
| ----------------------------- | ------- | ---------------- | ---------------- |
| `@media (max-width: 99999px)` | gray    | `rgb(220,38,38)` | `rgb(220,38,38)` |
| `@supports (display: flex)`   | gray    | `rgb(234,88,12)` | `rgb(234,88,12)` |
| `@media (max-width: 1000px)`  | gray    | gray             | `rgb(190,18,60)` |

After resizing back to `1100px`, the threshold target returned to gray.
Parsing and runtime media-query re-evaluation both work when the flag is on.

`prefers-reduced-motion: reduce` did not match the current macOS preference,
which is not evidence of a host preference signal. No
`Decode error: Context construct failed`, JSON parse proxy error, runtime
warning, or DevTool error occurred in either config state.

## Result 3: `enableNewTransformOrigin`

Contact sheet: `enableNewTransformOrigin/default-off-on.png`.

Rows:

- top: flag omitted;
- middle: explicit `false`;
- bottom: explicit `true`.

Columns:

- left: unrotated;
- right: after a real tap applies `rotate(90deg)`.

For both `transform-origin: center` and `50% 50%`, every config state produced
the same center delta:

```text
initial center -> rotated center: (-14px, 0px)
```

The computed origin was reported as `[50,11,50,11]`, but the rendered quad
still rotated around the top-left path. Omitted, `false`, and `true` are
behaviorally identical on Desktop.

Conclusion: the Desktop host/engine does not wire this flag to the observed
transform-origin behavior. The dual-SVG disclosure workaround remains.

## Product decision

The retained product config is restored to its pre-experiment state. This
issue establishes capability and upstream reporting, but does not enable the
two successful flags without the required full-screen theme, density, composer,
responsive, and motion regression matrix. That rollout remains separate.

Upstream follow-ups filed from this evidence:

- documentation/defaults: https://github.com/lynx-family/lynx/issues/8662
- Desktop transform-origin bug: https://github.com/lynx-family/lynx/issues/8663

## Screenshot budget rotation

The repository was already at the 100-image local limit. Three new contact
sheets replaced three superseded before frames:

- `appearance-settings-cell/lynx-light-390x844.png`, superseded by
  `lynx-light-390x844-after.png`;
- `new-thread-defaults/visual-matrix/lynx-wide-light-before.png`, superseded by
  `lynx-wide-light-after.png`;
- `plugins/visual-matrix/web-plugins-before-wide-light.png`, superseded by
  `web-plugins-after-wide-light.png`.

The removed bytes remain available in Git history. The final local screenshot
count remains 100.

## Final verification

- `bun fmt`: passed; unrelated repository-wide formatter churn was restored.
- `bun lint`: passed with 485 pre-existing warnings and zero errors.
- `bun typecheck`: passed across every workspace with a typecheck task.
- focused shared projection tests: 14/14 passed.
- focused local PDF preview test: 1/1 passed.
- `node scripts/lynx-css-report.ts --check`: 29/29 findings in baseline.
- final probe-free `apps/lynx` production build: passed.
- final product bundle SHA-256:
  `de9b6570e3586602161ee355bd5d76e2e7862de12209fd283a33b7e0d0721890`.
- final Rspeedy output and `dist/desktop/main.lynx.bundle` were byte-identical.
- final bundle/host outputs contain no probe marker or experiment environment
  name.
