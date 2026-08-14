# Dynamic theme token fidelity

## Classification

- Severity: P1 appearance loss.
- Authority: Web derives the full app token set from the active light/dark theme pack.
- Previous Lynx behavior:
  - Theme editor changes updated `ThemeState` and direct icon helpers.
  - Most UI surfaces still consumed static generated `--background`, `--foreground`, accent, border, semantic, and sidebar variables.
  - Custom palette, contrast, and surface edits therefore did not propagate across the Lynx UI.

## Fix

- Reuse the canonical `buildThemeCssVariables` and `resolveThemePack` pipeline.
- Resolve the active variant from explicit/system theme state.
- Apply the complete resolved variable map to `SliceRoot`.
- Keep generated light/dark CSS as startup and no-state fallback.
- Keep the previously fixed UI-font preference in the same root projection.
- Do not add a second Lynx-specific palette derivation.

## Verification

- `bun run test -- src/app/appTheme.logic.test.ts src/adapters/ThemePackEditorCompositionElements.lynx.test.tsx src/app/TranscriptAppearance.lynx.test.ts`
  - 3 files passed.
  - 16 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built and accepted the dynamic root variable map.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: root projection tests prove custom accent, ink, and surface values enter canonical app tokens.
- `product-pass`: Theme editor tests preserve import, contrast, preview, and live state behavior.
- `missing-coverage`: no retained visual custom-palette cell was captured because the isolated runtime did not have a controlled theme fixture through the canonical UI path.
- `native-unverified`: no exact-owned Native instance was launched for this slice.
