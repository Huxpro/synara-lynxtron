# Settings Skills current-head evidence

Status: retained Web, Lynx-for-Web, and exact-owned Native populated evidence

## Identity

- Source base: `29c229e9`
- Lynx-for-Web bundle SHA-256:
  `a5ec04ab00b88e4389560a4ade6a3454df39c5ae9731c1aa940a759b8110f18e`
- Native bundle SHA-256:
  `9c9046af0771ba420078a015f0d27b7dee4b019add7ab9a63c568245f5f69373`
- SQLite snapshot SHA-256:
  `c5313f03838f0669fc1e8cb558bf7d2d04c86b479bebc3a1559472c740db95a5`
- Route: Settings Skills
- Theme: light
- Density: comfortable
- State: real populated cross-provider catalog
- Browser viewport: `1280x820`, DPR 1
- Native outer window: `1280x820`
- Native LynxView frame: `2560x1576`, DPR 2

## Delivered parity

Before this slice, Skills was excluded from Lynx Settings and had no unified
catalog or toggle workflow.

The Lynx Skills panel now:

- calls the canonical `provider.listSkillsCatalog` and server-settings RPCs;
- applies the same normalized-name dedupe, source priority, provider ordering,
  shared-section rule, display fallback, and section taxonomy as Web;
- avoids Web's `toSorted` and locale-dependent comparator in PrimJS while
  preserving deterministic output;
- renders the portable skills summary, real Synara skills directory, grouped
  source rows, descriptions, paths, and 114 real switches;
- optimistically updates `skills.disabled`, serializes rapid toggles, and lets
  only the latest operation publish server results back to the renderer;
- rolls back the latest failed change and invalidates server settings, while
  successful changes invalidate Composer skill discovery.

## Geometry

Web / Native:

- content rail: `x=432, y=0, width=672`;
- header: `x=456, y=32, width=624, height=54`;
- portable card row: Web `x=457, y=151, 622x118.5`; Native
  `x=457, y=150, 622x120`;
- first shared skill row: Web `x=457, y=335.5, 622x125.5`; Native
  `x=457, y=334, 622x126`;
- first Native switch: `32x18`.

The first populated row is within 1.5px of Web. The initial Native pass placed
the shared section 15.5px too high; measurement assigned the residual to the
Skills-owned vertical rhythm, then corrected the panel gap and named
portable/skill row minimum heights rather than adding an anonymous margin.

## Runtime coverage

- Web reports 114 rendered switches.
- Lynx-for-Web reports 114 rendered switches.
- Native DOM contains 114 enabled switch nodes, including accessibility value,
  focusability, and real `bindtap` event publication.
- The full Native panel is about 18k logical pixels tall. This slice certifies
  correctness and first-screen fidelity; virtualization remains a measurable
  performance follow-up if catalog growth makes scrolling expensive.

The final exact-owned Native capture used PID `90594`, its PID-derived
`localhost:8904/session 1`, retained all seven required roles, and reported zero
warning/error console messages.

## State cleanup

No skill toggle was activated during evidence capture, so user skill settings
were not changed. The Native light-theme capture temporarily changed only the
owned `.p10-view-native` KV file. The app was stopped before restoration, and
the original bytes were restored with SHA-256
`f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.

## Lynx-for-Web correction

An earlier browser capture had hit Vite's SPA fallback instead of the generated Lynx-for-Web host because the staged `/lynx` assets were missing. That evidence was invalidated. The retained frame uses the staged current-head bundle, keeps the host URL under `/lynx/index.html`, and verifies the target `X-VIEW` class after memory-history navigation.
