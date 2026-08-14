# System UI font runtime fidelity

## Classification

- Severity: P1 appearance loss.
- Authority: Web uses `systemUiFont` to choose between the platform UI stack and the active theme pack's UI font.
- Previous Lynx behavior:
  - The setting was persisted into `ThemeState`.
  - The Lynx root always overrode `--font-ui-family` with `system-ui`.
  - Turning the setting off or editing a theme pack UI font could not change app typography.

## Fix

- Add a pure Lynx UI-font resolver beside the existing theme-variant projection.
- Preserve `system-ui` when the preference is enabled.
- When disabled, resolve the active light/dark theme pack and normalize its UI font with the shared font-family utility.
- Safely fall back to `system-ui` when the theme has no UI font.
- Apply the resolved value to the root `--font-ui-family` token so existing shared/UI CSS consumers update together.

## Verification

- `bun run test -- src/app/appTheme.logic.test.ts src/adapters/ThemePackEditorCompositionElements.lynx.test.tsx src/app/TranscriptAppearance.lynx.test.ts`
  - 3 files passed.
  - 15 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built and accepted the dynamic custom property.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: resolver tests cover system mode, active variant selection, CSS-safe quoting, and missing-font fallback.
- `product-pass`: appearance propagation tests preserve live Settings changes.
- `missing-coverage`: no retained visual font comparison was captured because installed-font availability was not controlled in the isolated runtime.
- `native-unverified`: no exact-owned Native instance was launched for this slice.
