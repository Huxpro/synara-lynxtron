# P10 surface material contract

Status: in progress

Updated: 2026-08-04

## Authority

Web production resolved styles are the visual authority. Native consumes the
same semantic derivation through stable root theme classes because Lynxtron
0.0.7 cannot reliably use runtime custom-property mutation.

Current owners:

- Web semantic roles: `apps/web/src/tokens.css`;
- Native generated projection:
  `apps/lynx/src/generated/native-theme-variables.css`;
- Native root/application consumers: `apps/lynx/src/app/App.css`;
- feature material consumers: shared composition Elements plus their narrow
  Lynx CSS adapters;
- residual evidence:
  `shots/2026-08-04/p10-perceptual-fidelity/manifest.json`.

No feature page may introduce a second ordinary canvas/sidebar/popover/control
palette. A host-only approximation must be named and registered as
`ENGINE_CORRECTION` or `INTENTIONAL_PLATFORM_DELTA`.

## Semantic roles

| Role | Canonical tokens | Required consumers | Current disposition |
| --- | --- | --- | --- |
| Canvas | `--background`, `--foreground` | app root, route body | Product-consumed in light/dark; current P10 proof is light only |
| Sidebar | `--sidebar`, `--sidebar-foreground`, `--sidebar-border` | Sidebar shell and rows | Canonical light frame retained; dark P10 proof missing |
| Content | `--background`, `--card`, text roles | thread/settings/route content | Product-consumed; route-wide P10 proof missing |
| Inset | `--muted`, elevated-secondary aliases | cards, code/work/status insets | Product-consumed; P10 samples incomplete |
| Elevated | `--color-background-elevated-*` | panels, cards, right dock | Product-consumed; current P10 role sample missing |
| Popover | `--popover`, `--popover-foreground`, `--border` | Project Picker, command menus, model/trait menus | Canonical Project Picker and skill menu retained |
| Selected | `--accent`, `--accent-foreground`, Sidebar active aliases | selected rows/options/tabs/cards | Canonical active skill row retained; route coverage incomplete |
| Hover | feature `ui-hover` recipes derived from semantic tokens | all enabled view-backed controls | Product source and older runtime proof; current P10 state frames missing |
| Pressed | feature `ui-pressed` recipes | enabled actions | Product source and older runtime proof; current P10 state frames missing |
| Focus | `--ring` and feature focus recipes | keyboard-focusable controls | Source proof; host Tab publication remains a registered Native gap |
| Separator | `--border`, `--sidebar-border` | rows, cards, panels | Settings and picker geometry retained |
| Destructive | `--destructive`, status-failure aliases | errors/destructive actions | Product-consumed; current P10 samples missing |
| Warning | `--warning`, status-warning aliases | stale/degraded states | Product-consumed; current P10 samples missing |
| Success | `--success`, status-success aliases | completion/healthy states | Product-consumed; current P10 samples missing |

## Resolved light/dark anchors

The generated Native sheet currently resolves these high-area anchors:

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#ffffff` | `#101010` |
| Sidebar | `#ffffff` | `#111111` |
| Popover | `rgb(255,255,255)` | `rgb(23,23,23)` |
| Border | `rgba(13,13,13,0.069)` | `rgba(252,252,252,0.072)` |
| Selected/accent | `#e8f2fa` | `#000f1d` |
| Ring | `#0169cc` | `rgba(51,134,214,0.63)` |
| Composer | translucent control projection | `rgb(23,23,23)` |

These are implementation anchors, not independent design choices. Generator
and theme-logic tests must continue proving their relationship to the Web
authority.

## Material anatomy

- Composer default: 19.2px radius, 1px low-opacity border, one restrained
  `0 4px 18px -6px` shadow.
- Command menu: 14px radius, no shadow, 1px border; active row 8px radius.
- Project Picker: elevated/popover surface, 1px border, restrained host shadow.
- Settings controls: opaque control surface, 10px radius, 1px 7% border.
- Nested badges/chips/pills must sample their own background and text; parent
  card parity is not sufficient.
- Native titlebar is outside product content and is normalized by the named
  32px comparison crop. It is not a product mask.

## Current evidence

P10 current-build material proof exists for:

- landing canvas/sidebar/content;
- default Composer;
- Project Picker open;
- filtered skill menu active state;
- Settings General controls.

All are light, comfortable, 1280×820. P7-I4 and P8-Q2 demonstrate that the
current product architecture supports dark and route-wide consumers, but their
older frames cannot certify the post-P10 calibration build.

## Remaining gate

This contract becomes complete only when:

1. dark current-build samples exist for every semantic role above;
2. Thread, Kanban, Pull Requests, Extras, Command K, mention, status, and
   loading/error/empty surfaces are represented in the P10 atlas;
3. nested badge/chip/pill samples are retained;
4. every host shadow or material approximation is registered;
5. no open P0/P1 material residual remains.
