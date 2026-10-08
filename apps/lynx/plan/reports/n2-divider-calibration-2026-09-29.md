# N2 — Surface divider calibration

Status: exit criteria met for the listed dividers on 2026-09-29.
Plan: [core-goal-review-and-next-phase-2026-09-29.md](core-goal-review-and-next-phase-2026-09-29.md) § N2.
Evidence: [n2-divider-matrix-2026-09-29.json](n2-divider-matrix-2026-09-29.json) (numbers only, no screenshots).

## What was wrong

Measured on the canonical fixture before any change (dark, 1079×803):

| Divider                                  | Electron                                 | Native before                                                           |
| ---------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| Thread header hairline                   | 60% gradient, layout-neutral             | **not painted** (`--app-surface-divider` undefined)                     |
| Right dock seam                          | `--app-surface-divider` (60%)            | full `--border` (100%)                                                  |
| Dock tab / preview / Diff / pane headers | 60% gradient, layout-neutral             | 100% border occupying 1px of layout                                     |
| Explorer tree seam, search divider       | `border-border/65`                       | 100%                                                                    |
| Diff toolbar separators                  | `bg-border/60`                           | **transparent** (`color-mix()` unsupported)                             |
| Git list/diff split                      | `border-border/70` on the diff viewport  | 100% on the file list, 12px lower                                       |
| Git pane header                          | 46px `DockPaneHeader`                    | 36px, 100% border                                                       |
| Browser toolbar / tab bar                | 46px hairline row / 45px `border-border` | 40px border row / 40px bar whose border was covered by the home surface |

Two root causes sit under most of these:

1. **Lynx has no `color-mix()`.** With `var()` arguments it computes to
   transparent; with literals the declaration is dropped. Native CSS had 56
   distinct `color-mix()` expressions (dividers, surfaces, text, shadows) that
   silently failed.
2. **Lynx does not resolve `var()` chains inside custom properties.** A
   property defined as `var(--other)` computes to nothing, so even a correct
   recipe routed through `--app-surface-divider` could not paint.

## Fix

- **Build-time color-mix projection** (`apps/lynx/scripts/color-mix.logic.mjs`,
  `generate-color-mix-tokens.mjs`, `postcss.config.mjs`). Native CSS keeps
  Electron's recipes verbatim. Every expression is evaluated per theme against
  the Native theme variables, reproducing Chromium: 8-bit input alpha,
  premultiplied interpolation in srgb/oklab. The PostCSS plugin swaps each one
  for a generated token. Custom properties defined as a `color-mix()` are
  emitted by name, per theme, with their literal, honoring cascade scope
  (theme block > `:root`; `.SliceRoot` rules win over both). An unknown
  expression fails the build. 70 tokens, 0 unresolvable.
- **One source for the surface divider.** Native defines
  `--app-surface-divider` with the exact declaration from
  `apps/web/src/index.css`, and a test enforces the equality.
- **Consumers use Electron's recipe for their role.** The dock seam uses
  `--app-surface-divider`. The Explorer seam and search divider use
  `color-mix(in oklab, var(--color-border) 65%, transparent)` (Tailwind
  `border-border/65`), and the truncated-notice divider uses the 45% recipe.
  The Git split moved to the diff viewport with the 70% recipe, and the Diff
  toolbar separators use the 60% recipe.
- **Header rows use the shared layout-neutral hairline**
  (`.chat-surface-divider`) instead of borders: thread header, dock tab strip,
  Explorer preview, Diff toolbar, Browser toolbar, plus the Kanban/PR route
  headers, Automations list/detail headers, Workspace page, Editor header,
  and the standalone Diff tab strip. Two of those still used the
  `border-bottom: 1px solid var(--border)` shorthand, which Lynx paints black.
- **Shared `DockPaneHeader`** (`apps/lynx/src/app/DockPaneHeader.lynx.tsx`),
  mirroring Electron's: 46px, 13px medium title, 28px icon buttons, close
  action. Source control now uses it.
- **Geometry that moved the dividers.** The Git list now has Electron's
  vertical rhythm. It uses an inner flex column, because Lynx `scroll-view`
  ignores `gap`. The Browser tab bar is 45px with 32px tabs, and the home
  surface and embedded web view are offset by 46 + 45px.

## Verification

`scripts/comparison-measure.mjs` measures each divider in both renderers of a
certified run (N1): what paints the edge (border vs gradient), color, alpha,
thickness, and window-space position. `scripts/comparison-probes/*.json`
locate dividers structurally, not by coordinates.

A pixel check sampled the divider row against its neighbor in temporary
captures of both windows, recorded only the luminance deltas, and deleted the
captures.

| Matrix                                                                     | Result                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------- |
| 4 surfaces (Explorer, Diff, Git, Browser) × light/dark × 1280×820/1440×900 | 16/16 cells, 80/80 divider probes pass              |
| Largest alpha difference                                                   | 0.00333 (tolerance 1/255 = 0.00392)                 |
| Largest edge offset                                                        | 1px (tolerance 1px)                                 |
| Paint kind (border vs layout-neutral gradient)                             | identical for all 11 dividers                       |
| Pixel luminance delta, Electron vs Native                                  | within 1 level (3 levels at a 230-level seam, 1.3%) |

Every run was a certified N1 run and shut down with zero owned processes.

## Not covered / residuals

- The eight route/page headers migrated by recipe (Kanban, PR, Automations ×4,
  Workspace, Editor, standalone Diff tab strip) have source and unit-test
  coverage only. Their paired measurement belongs to the N4 page cells.
- Electron retracts the thread-header hairline by 1px at the sidebar seam
  (`[data-sidebar-side="left"] .chat-content-card .chat-surface-divider`).
  Native does not; the difference is one pixel at the corner, within
  tolerance.
- Diff toolbar icon buttons are 28px in Native vs 24px (`icon-xs`) in Electron,
  so the toolbar separators sit ~16px right of Electron's. Their color is now
  correct; control sizing is N4.
- Git file rows show a text "Stage" button; Electron shows a 24px icon button
  revealed on hover. Row height now matches; composition is N4.
- Browser tab width is fixed at 150px vs Electron's content-sized tab
  (max 224px). N4.
