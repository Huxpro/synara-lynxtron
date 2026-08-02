# P7-I4 theme / motion inventory

Status: completed · 2026-07-31

## Product contract

P7-I4 closes two related presentation contracts across the six production
routes:

1. light and dark use the canonical Synara semantic-token derivation for base,
   selected, elevated, focus, status, composer, sidebar, and overlay surfaces;
2. meaningful state changes use one restrained motion contract, with an
   explicit reduced-motion or platform fallback and no layout/scroll feedback.

The product context is calm, precise, and utilitarian. Motion is feedback, not
decoration. Performance constraints are the Lynx dual-thread renderer,
long-running/streaming transcripts, nested scroll containers, and the existing
Web priority of predictable behavior under load. Prefer transform/opacity;
never couple animation measurement back into transcript following.

## Final authority and proof

| Surface | Web authority | Native current state | Required proof / gap |
|---|---|---|---|
| Theme state | `ThemeState`, `resolveThemeVariant`, `resolveThemePack`, and `buildThemeCssVariables` own canonical mode/pack/token derivation; `useTheme` projects it to the Web root | `App` hydrates the same canonical payload, publishes a stable root class, receives live Settings/theme-pack updates, and restores the persisted variant on restart; `useTheme.lynx` reports the active canonical variant/pack | Real Dark → Light UI switch updated storage and `SliceRoot--theme-light` in-process; a separate dark restart restored `SliceRoot--theme-dark` |
| Base shell / Sidebar | Web root variables feed `background`, `foreground`, `sidebar`, border and active/elevated aliases | generated light/dark selector sheets project canonical semantic values directly because runtime custom-property mutation is not a Lynxtron authority | Real thread shell/sidebar/header/content and selected/elevated rows were captured in both variants |
| Thread / transcript / composer | Web uses canonical background, panel/control, user-message, text, focus and status variables | physical-shared anatomy consumes the generated root semantic projection; embedded SVGs receive explicit canonical paint | Real assistant/user/work/composer surfaces and provider/status icons were captured in both variants; disclosure exit never feeds transcript measurement |
| Settings | Web Settings consumes the same root theme as all routes | Settings consumes the application root theme; the former page-local dark authority is removed/narrowed to host-specific layout fixes | Dark Appearance and a live in-process Light switch were captured through the real Settings UI |
| Kanban | shared card/column/overview compositions use `card`, elevated, ring, status, and muted tokens | the same composition consumes the generated light/dark semantic values | Real projected cards and status roles were captured in both variants |
| Pull requests | shared list/row/detail compositions use selected/elevated/focus/status tokens | the same composition consumes the generated light/dark semantic values | Real PR route/filter/empty state was captured in both variants |
| Overlays | Web Menu/Dialog use popover, scrim, elevation, border and focus tokens | Native Menu/Dialog consume the root popover/scrim/border projection; host shadow remains the registered non-color-mix approximation | The real All projects menu was captured in both variants with legible surface, border, selection, and icon contrast |
| Motion authority | Web `platform/motion` re-exports the single 220 ms disclosure contract with reduced-motion fallbacks | exact-aliased Native `platform/motion` uses the same semantic duration plus a 40 ms cleanup allowance, transform/opacity state classes, and chevron rotation | Real Sidebar close: closed class at 4.93 ms, body present at 100 ms, absent at 320 ms. Transcript intentionally disables exit presence to protect list measurement/follow |

## Semantic token groups

The first product cut must project at least these canonical groups rather than
inventing a second palette:

- base: `--background`, `--foreground`, `--card`, `--card-foreground`,
  `--border`;
- controls: `--primary`, `--primary-foreground`, `--secondary`,
  `--secondary-foreground`, `--muted`, `--muted-foreground`, `--input`,
  `--ring`;
- elevated/overlay: `--popover`, `--popover-foreground`,
  `--color-background-elevated-primary-opaque`,
  `--color-background-elevated-secondary`, `--color-simple-scrim`;
- application: `--app-shell-background`, `--app-user-message-background`,
  `--composer-surface`, Sidebar aliases;
- status: destructive, success, warning, info, and `--status-*`;
- text/icon/focus aliases consumed by physical-shared compositions.

Because Lynxtron 0.0.7 does not reliably apply runtime custom-property
mutation, stable root classes are an allowed host adapter. Their values must be
generated from or regression-tested against canonical `theme.logic`; a
hand-maintained unrelated dark palette is not acceptable.

## Completed verification cuts

1. Hydrate canonical `ThemeState` in `App`, publish a stable root theme class,
   and propagate Settings/theme-pack mutations back to the root.
2. Derive or validate the Native light/dark semantic sheets against canonical
   `buildThemeCssVariables`; remove Settings-only authority and update the
   shared `useTheme` adapter.
3. Prove live light→dark→light, dark restart persistence, and both variants on
   thread, Kanban, PR, Settings, and overlay consumers using one real snapshot.
4. Add the Native motion contract and migrate real Sidebar/transcript
   disclosures; verify timing/state continuity and the reduced-motion/platform
   downgrade.
5. Run focused tests, both production builds, strict serial audits, both
   repositories' `git diff --check`, and update 01/02/03/04/LOG plus evidence.

All five cuts are complete. The authoritative runtime checklist, retained
frames, exact platform downgrade, gates, and cleanup hashes are recorded in
[`shots/2026-07-31/port/p7-i4/root-theme/notes.md`](../../shots/2026-07-31/port/p7-i4/root-theme/notes.md).

Final gates:

- Web focused: 2 files / 27 tests.
- Slice focused: 4 files / 11 tests.
- Web production: 8,909 modules.
- Slice production: 2245.5 kB Lynx / 2362.4 kB desktop.
- strict reuse: threads 55.10%, shell 63.38%, thread 38.29%, settings 51.24%,
  projects/Kanban 52.20%, Pull Requests 57.12%.
- style: 98.06% (2,253 classes / 13,185 weighted occurrences).
- both repositories' `git diff --check` passed; product KV/window state was
  restored byte-exact and all owned ports were released.
