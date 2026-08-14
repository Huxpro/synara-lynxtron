# Theme token memoization

## Classification

- Severity: P1 performance follow-up.
- Dynamic theme support builds a large root CSS-variable map.
- Previous App rendering rebuilt that map on every transport, viewport, bootstrap, or router-state render even when theme state was unchanged.
- Replacing the root style object could also trigger unnecessary style propagation through the full Lynx tree.

## Fix

- Memoize the root theme-variable map.
- Depend only on canonical `themeState` and `systemDark`.
- Preserve immediate updates for palette, contrast, fonts, mode, and system appearance.
- Keep unrelated transport/viewport renders on a stable style object.

## Verification

- `bun run test -- src/app/appTheme.logic.test.ts src/app/appHydration.logic.test.ts src/app/ResponsiveLayout.lynx.test.ts`
  - 3 files passed.
  - 9 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: dynamic token, hydration fallback, and responsive root contracts remain covered.
- `performance-fix`: unrelated App renders no longer rebuild or replace the root theme token map.
