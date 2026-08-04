# P10 optical control calibration

Status: in progress

Updated: 2026-08-04

## Contract

Optical calibration is owned by shared primitives or narrow platform adapters,
never feature call sites. Box equality is insufficient: retained specimens
must compare painted glyph bounds, icon/text baseline, content center, label
gap, repeated rhythm, and state continuity.

State vocabulary:

- `default`;
- `hover`;
- `pressed`;
- `selected`;
- `disabled`;
- `focused`;
- `loading` where the control can load.

Native state classes are produced by
`apps/lynx/src/components/ui/interactive-state.lynx.ts`; feature CSS consumes
`ui-hover`, `ui-pressed`, `ui-focus`, and disabled/selected modifiers. Host Tab
focus publication remains an intentional Lynxtron gap; source focus wiring is
not misreported as runtime delivery.

## Golden specimen inventory

| # | Specimen | Product owner | Optical anchors | Current proof | P10 gap |
| ---: | --- | --- | --- | --- | --- |
| 1 | Sidebar row | shared Sidebar row + adapter CSS | 20px leading slot, label baseline, trailing actions, 28px rhythm | canonical default + older interaction runtime | current hover/pressed/focus frames |
| 2 | Segmented control | Sidebar segmented picker | equal segment center, label baseline, selected fill | source + older runtime | current state matrix |
| 3 | Icon button | shared Button / narrow feature adapter | hit box, painted glyph, visual center | multiple product consumers | consolidated specimen evidence |
| 4 | Disclosure + chevron | shared disclosure compositions + platform motion | chevron painted bounds, 0→90° center, row baseline | source, tests, older timing proof | current fixed-time proof |
| 5 | Composer shell | shared Composer input composition | 736×95 shell, 19.2px radius, editor/footer balance | three-client default | focused/sending/loading states |
| 6 | Textarea | Web editor / Native textarea island | 12/19.5 text role, 39px field, selection/input semantics | P9-D1 + P10 Native | dark/two-size state proof |
| 7 | Project-picker row | shared MenuItem composition | 14px icon, title rail, row center, highlight | three-client open picker | hover/pressed/disabled frames |
| 8 | Command-menu row | shared command composition | 16px slot, 14px painted icon, 11.5/11/10.5 text rails | three-client filtered skill | hover/pressed/focus/disabled frames |
| 9 | Switch | shared Settings switches | thumb/track center, label alignment, checked fill | source/tests/older runtime | current all-state frame |
| 10 | Checkbox/radio | trait/theme controls | mark center, label gap, selected contrast | source/tests | current all-state frame |
| 11 | Tooltip/popover | Menu/popup product consumers | trigger alignment ≤2px, surface edge/radius | picker/menu evidence | tooltip product-consumer boundary and state sequence |
| 12 | Chip/token | Composer inline projection | single semantic token, icon/text center, delete affordance | P9 selected/cleared persistence | import into P10 atlas |
| 13 | Status row | transcript/lifecycle/route-state composition | status icon baseline, meta density, row rhythm | source and P8/P9 evidence | current P10 loading/error/success specimens |
| 14 | Empty-state header | shared empty hero | logo/heading center, 30px heading metrics | three-client landing | dark/two-size proof |
| 15 | Primary/secondary button | shared Button and route actions | label/icon center, disabled opacity, pressed feedback | source and route consumers | consolidated current state matrix |

## Named corrections

Current named corrections:

- `--engine-landing-heading-letter-spacing`: Native `-1.8px`, Web-host
  `-0.45px`;
- stable landing heading width: `321px`;
- generated icon `size` is passed explicitly where a 14px painted glyph must
  fit a 16px slot;
- Native semantic typography role overrides live on `.SliceRoot`.

No anonymous feature margin may be added to simulate painted-bound parity.
When a new correction is required, name it by role (`iconOpticalScale`,
`iconBaselineOffset`, `controlContentOffset`, or equivalent), centralize it,
test it, and register the engine reason.

## Measurement gates

- high-frequency position/size delta ≤2px;
- repeated row cumulative drift ≤2px;
- icon/text baseline delta ≤1px;
- popup trigger alignment ≤2px;
- every state keeps the same visual center;
- disabled controls are not focusable or activatable;
- generated SVGs replace text glyph placeholders;
- no screenshot-only fixture enters the production graph.

## Current result

The canonical landing, Composer, Project Picker, skill menu, and Settings
specimens satisfy their measured default/open/active geometry. The filtered
skill row retains:

- 726×122 surface;
- 716×28 row;
- 16×16 icon slot;
- 14×14 painted icon;
- exact four-item order and active first row.

The product has broad interaction-state implementation and older runtime proof,
but there is no single current-build P10 golden state matrix. Therefore Phase 3
remains in progress.

## Remaining gate

1. Retain current-build state specimens for all 15 rows above.
2. Record painted bounds and visual-center dispositions.
3. Register any P2 engine correction and close all P0/P1 residuals.
4. Prove shared primitive changes across at least two consuming routes.
