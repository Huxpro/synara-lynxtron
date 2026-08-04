# P10 surface material contract

Status: complete

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

| Role        | Canonical tokens                                          | Required consumers                               | Current disposition                                                           |
| ----------- | --------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Canvas      | `--background`, `--foreground`                            | app root, route body                             | Retained in light/dark across all five route families                         |
| Sidebar     | `--sidebar`, `--sidebar-foreground`, `--sidebar-border`   | Sidebar shell and rows                           | Retained in light/dark at both sizes                                          |
| Content     | `--background`, `--card`, text roles                      | thread/settings/route content                    | Thread, Settings, Kanban, and PR current-build proof retained                 |
| Inset       | `--muted`, elevated-secondary aliases                     | cards, code/work/status insets                   | Transcript, route card, status, and popup samples retained                    |
| Elevated    | `--color-background-elevated-*`                           | panels, cards, right dock                        | Settings, route cards, Project Picker, Extras, and Command K retained         |
| Popover     | `--popover`, `--popover-foreground`, `--border`           | Project Picker, command menus, model/trait menus | Two-theme/two-size overlay matrix retained                                    |
| Selected    | `--accent`, `--accent-foreground`, Sidebar active aliases | selected rows/options/tabs/cards                 | Active thread/project/menu rows and selected chip retained                    |
| Hover       | feature `ui-hover` recipes derived from semantic tokens   | all enabled view-backed controls                 | Web authority plus current focused contract; Native mouseenter gap registered |
| Pressed     | feature `ui-pressed` recipes                              | enabled actions                                  | Current Native runtime proves feedback with no geometry drift                 |
| Focus       | `--ring` and feature focus recipes                        | keyboard-focusable controls                      | Source/test proof retained; host Tab publication is an intentional delta      |
| Separator   | `--border`, `--sidebar-border`                            | rows, cards, panels                              | Route, Settings, picker, and menu geometry retained                           |
| Destructive | `--destructive`, status-failure aliases                   | errors/destructive actions                       | Current system-state/error tests retained                                     |
| Warning     | `--warning`, status-warning aliases                       | stale/degraded states                            | Current degraded/loading/status tests retained                                |
| Success     | `--success`, status-success aliases                       | completion/healthy states                        | Current completion/status rows and route tests retained                       |

## Resolved light/dark anchors

The generated Native sheet currently resolves these high-area anchors:

| Role            | Light                          | Dark                      |
| --------------- | ------------------------------ | ------------------------- |
| Canvas          | `#ffffff`                      | `#101010`                 |
| Sidebar         | `#ffffff`                      | `#111111`                 |
| Popover         | `rgb(255,255,255)`             | `rgb(23,23,23)`           |
| Border          | `rgba(13,13,13,0.069)`         | `rgba(252,252,252,0.072)` |
| Selected/accent | `#e8f2fa`                      | `#000f1d`                 |
| Ring            | `#0169cc`                      | `rgba(51,134,214,0.63)`   |
| Composer        | translucent control projection | `rgb(23,23,23)`           |

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

## Final evidence

Current-build material proof includes:

- the complete 20-state route matrix across light/dark and both target sizes;
- the complete Project Picker, Extras, Command K, skill, and mention overlay
  matrix;
- selected, pressed, disabled, focused, loading, error, success, and empty
  dispositions in the strict specimen manifest;
- a semantic mention chip sample and command-row painted-bound metrics;
- empty Native warning/error consoles for retained runtime frames.

The Project Picker host-local-folder capability is registered as a P3
intentional platform delta. Native/Lynx mouseenter and host Tab focus
publication remain narrow interaction deltas, not material mismatches. Native
titlebar normalization remains the named 32px crop.

Every host shadow/material approximation is represented by an owned primitive
or registered delta. No open P0/P1 material residual remains. Strict
verification reports **44 states / 0 incomplete / 0 blocking** and **15
controls / 12 temporal surfaces / 0 incomplete**.
