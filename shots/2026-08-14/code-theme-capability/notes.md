# Code theme capability fidelity

## Classification

- Severity: P1 misleading setting.
- Authority: Web supports the full code-theme catalog and applies the selected `codeThemeId` to its highlighter.
- Lynx host capability:
  - Native and Lynx-for-Web syntax highlighting currently package fixed GitHub light/dark Shiki themes.
  - The highlight RPC accepts only light/dark, not an arbitrary code-theme ID.
- Previous Lynx behavior: the Theme editor exposed the full code-theme selector and persisted selections that could not affect Explorer/Native highlighting.

## Fix

- Add an explicit `showCodeThemeSelection` capability to the shared Theme pack editor.
- Web opts in and retains the complete catalog selector.
- Lynx opts out until its syntax-highlight host and RPC support arbitrary packaged themes.
- Keep palette, contrast, fonts, import/share, reset, and live root token editing available in Lynx.
- Preserve stored `codeThemeIds`; future host support can re-enable the selector without migration.

## Verification

- Web: `bun run test -- src/components/settings/SettingsAppearanceComposition.test.tsx`
  - 1 file passed.
  - 1 test passed.
  - Verifies the code-theme selector remains rendered.
- Lynx: `bun run test -- src/app/settingsNavigation.test.ts src/adapters/ThemePackEditorCompositionElements.lynx.test.tsx`
  - 2 files passed.
  - 20 tests passed.
  - Verifies capability-off wiring while preserving palette editor behavior.
- Workspace: `CI=1 bun run build`
  - `6 successful, 6 total`.
  - Web and Lynx were cache misses and built successfully.
  - The Turbo wrapper remained alive after the success summary and was reclaimed as owned process cleanup.

## Evidence ledger

- `intentional-delta`: Lynx syntax highlighting remains fixed GitHub light/dark until the host contract supports catalog IDs.
- `product-fix`: Lynx no longer presents unsupported code-theme choices as functional.
- `product-pass`: Web retains the full supported selector.
- `native-unverified`: no exact-owned Native instance was launched for this capability gate.
