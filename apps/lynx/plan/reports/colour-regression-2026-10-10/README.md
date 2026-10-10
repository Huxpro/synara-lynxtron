# Colour regression: Native against Electron, 2026-10-10

First colour comparison since `enableCSSInlineVariables` was turned on. Geometry was already measured by the cell matrix; this adds colour.

## Result

| Theme | Pairs within 4/255 before | After         | Text              | Control fill      | Icon            | Border      |
| ----- | ------------------------- | ------------- | ----------------- | ----------------- | --------------- | ----------- |
| dark  | 714/947 (75%)             | 791/947 (84%) | 345 → 361 of 376  | 344 → 345 of 367  | 23 → 83 of 188  | 2 → 2 of 16 |
| light | 646/817 (79%)             | 801/940 (85%) | 308/334 → 360/376 | 305/313 → 355/363 | 31/159 → 84/185 | 2/11 → 2/16 |

Counts exclude background pairs: the first pass also recorded a background for inline text runs (paragraph pixels), a rule that was dropped, so backgrounds are not comparable across passes (after: dark 226/235, light 212/235). The light "before" pass has no Diff surface: Electron showed a server capacity error instead of the diff (machine load). Per-surface tables and every differing colour pair: [SUMMARY.md](SUMMARY.md); first pass: [before.json](before.json).

Root theme variables (Native inline map against what Electron resolves): 189/195 dark and 188/194 light resolve alike; the rest are the window-material variables below.

## What the flag changed

- The comparison harness stores the theme as a bare mode string (`"dark"`). Upstream's `normalizeThemeState` reads that as an existing store and gives it the **Codex** pack (accent `#0169cc`), not the Synara pack of `DEFAULT_THEME_STATE` (accent `#f2612d` / `#c74614`) that the generated stylesheet is built from. The two packs differ in 28 accent-family variables per theme and nothing else.
- Before the flag Native painted those 28 from the stylesheet (Synara orange) while Electron painted Codex blue. With the flag the root inline map wins and Native resolves them as Electron does. This is the only effect of the flag on root colours: for the pack the stylesheet is generated from, the inline map and the stylesheet are identical value for value (205 variables, checked offline).
- The var()-valued root values the theme code leaves out of the inline map are `--app-composer-picker-surface`, `--app-overlay-surface`, and in light `--composer-surface`. The stylesheet's generated value stays in effect for each; complete and correct for the default pack.
- The other inline custom properties the flag activated (`Transcript.tsx`, `Composer.lynx.tsx`) are sizes, not colours.
- `App.css` still restates 14 state-surface variables per theme under `.SliceRoot--theme-*`. The inline map now overrides them. Six differ from upstream's values by one to three levels (`--destructive-hover-fill`, `--primary-hover-fill`, `--secondary-button-state-surface`, `--secondary-outline-state-surface`, `--subtle-button-state-surface`); the inline values are upstream's own, so this moved Native towards Electron. The block is dead code now.

## Differences by class

### (a) Resolves differently because of inline variables

None found that is worse than before. See above.

### (b) Derived colour-mix tokens are generated at build time

- Accent-derived tokens follow the Synara pack whatever pack is active: `color-mix(var(--color-border-focus) 60%, transparent)` and `color-mix(var(--color-text-accent) 16%, transparent)` are orange in the generated sheet and blue on Electron in this harness (74 to 119 levels). Recorded, not fixed (planned for the next phase).
- `--control-focus-ring-color` is also hard-coded Codex blue in `App.css`, after the generated sheet. That matches Electron for a stored (Codex) theme and is wrong for a fresh install (Synara orange). Not measurable here: the DevTool cannot focus or hover.
- For the default pack the generated tokens match Chromium's arithmetic for 89/94 (dark) and 85/90 (light). The five that do not all mix a Tailwind v4 colour that is outside sRGB (`green-500`, `orange-500`, `yellow-400`, `amber-500`, `violet-500`): Chromium mixes the unclipped colour, the generator the clipped hex (5 to 55 levels).

### (c) Lynx-side differences unrelated to the flag: fixed

| Difference                                     | Before (Electron / Native)                   | Fix                                                                                                                                                                |
| ---------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dark diff: added and removed lines had no tint | `#111b15` / `#111312`                        | Removed the dark overrides (alpha 0.016) in `pull-request-code-composition-elements.css`; the per-theme colour-mix token applies as in light. Now `#0f1c14`.       |
| Icon rail, resting glyphs too bright           | ink at 0.34 / 0.58                           | `sectionLabelForeground` in `useTheme.lynx.ts` (upstream `text-muted-foreground/58`), used by `AppRail.lynx.tsx`.                                                  |
| Icon rail, active glyph too dim                | ink at 1.0 / 0.72                            | Active glyph uses the foreground.                                                                                                                                  |
| Usage ring track too bright                    | section-label tone at 15% / secondary at 15% | Same tone as upstream.                                                                                                                                             |
| Usage ring colours                             | `#00bc7d` `#f0b100` / `#10b981` `#eab308`    | Tailwind v4 values in `AppRailUsage.lynx.tsx`.                                                                                                                     |
| Base palette was partly Tailwind v3            | e.g. emerald-500 `#00bc7d` / `#10b981`       | Twelve values in `lynx-overrides.css` (red, amber, emerald, indigo, neutral-400, zinc-500) set to the v4 colours Electron resolves; colour-mix tokens regenerated. |
| Sidebar "Chats" label                          | muted at 80% / 100%                          | `sidebar.css`.                                                                                                                                                     |
| Project name in the sidebar                    | foreground at 95% / 100%                     | `sidebar-project-summary-elements.css`.                                                                                                                            |
| Model trigger effort label, dark               | muted at 45% / icon-secondary                | `composer.css`.                                                                                                                                                    |

### (c) Still open

See the follow-up list in the tracking issue. The largest: header and dock toolbar icon tones, bordered header buttons, diff gutter and change-bar colour, the "unmodified lines" band, Kanban column label tones, model-menu provider icons, and text drawn with `opacity` (rasterised soft on Native).

### (d) Electron-only effects

- **Window material.** Electron takes the translucent branch of `buildThemeCssVariables` (macOS vibrancy): `--app-shell-background`, `--app-content-surface`, `--app-sidebar-surface`, `--app-settings-surface` are transparent, `--app-window-background` and `--app-sidebar-chip-surface` are a 90% coat (dark: 80% surface, 20% black). Native takes the opaque branch. Composited over the opaque window colour the dark coat measures `#0d0d0d` against Native's `#101010` (content) and `#111111` (sidebar): three to four levels, at the threshold; on a real desktop it depends on the wallpaper.
- **Raised glass tint** (`--app-glass-raised-surface`, `.app-glass-raised`). On glass, cards, filled controls, the composer and the active tab take one denser tint: settings cards `#fafafa` light (Native `#ffffff`), active tab `#202020` dark (Native `#111111`), diff file header `#161616` (Native `#101010`). This is why the light Settings grid differs in 23 to 30% of its cells.
- **Backdrop blur** on menus and the composer (`--app-composer-picker-backdrop-filter: blur(32px)`, `--app-overlay-surface` at 31% in light): Native paints the opaque-branch value (55%).
- **Hover.** The Lynx DevTool has touch emulation only, so `rail-hover` shows the hovered item on Electron and the resting rail on Native.

## Reading the numbers

- A pair is one element both renderers show under the same text or accessible label. Text and icon colours come from computed style (Electron `getComputedStyle`, Native `CSS.getComputedStyleForNode` and the SVG's inline paint), composited over the pixels behind them; each side's own screenshot overrules its computed colour when the two disagree by more than 24 levels. Backgrounds and control fills are the most frequent pixel colour of the element's box.
- Icon pairs are the noisiest: the two renderers use different glyph sets, and where the pixels arbitrate, stroke thickness shifts the result. Three rail items (Inbox, Spaces, and Home when idle) still read 25 to 33 levels apart that way although both sides declare the same colour.
- Five border pairs (diff toolbar groups, "Editor options") read black on Native: computed style reports the default colour for a border the screenshot shows painted normally. Treat them as unread, not as findings.
- Switch controls ("Move sent messages to top", "Delete worktree on archive") are paired by label on different elements (thumb against track): not a colour difference.
- "Computer use" is disabled on Native, the landing "Temporary"/"Worktree" toggle and "Restore defaults" are state differences.
- The usage endpoint was reachable in these runs; a differing "Claude usage" label would not be a colour finding.

## Worth a human look

| Pair                                                  | Why                                                                                                                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dark-thread-dock-diff`                               | Diff tints after the fix; the change bar (Electron 4px `#34d057`, Native 2px `#00a240`), the "unmodified lines" band and the centre divider remain. |
| `light-settings-general`, `light-settings-appearance` | Raised-glass card tint on Electron, flat white on Native.                                                                                           |
| `dark-thread`, `light-thread`                         | Rail and sidebar tones after the fix; bordered header buttons on Native; text drawn with `opacity` looks soft on Native.                            |
| `dark-thread-model-menu`                              | Provider icon tones and count badges.                                                                                                               |
| `dark-kanban`                                         | Column label tones.                                                                                                                                 |

## Re-running

```sh
bun run compare:desktop --width 1280 --height 820 --theme dark --lynx-devtool-port 8915   # wait for "Run manifest"
node scripts/comparison-colours.mjs --out <dir> [--surfaces thread,kanban] [--images <dir for full PNGs>]
# stop the launcher (SIGINT), repeat with --theme light --skip-build, then:
node scripts/comparison-colours.mjs --summarise <dir>
```

Run it on a fresh launch, before the workflows. The script writes compact JSON; run `bunx oxfmt <dir>/*.json <dir>/*.md` before committing an archive. Full-size PNGs are not archived; the JPEGs here are 1280 wide.
