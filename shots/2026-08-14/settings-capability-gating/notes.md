# Settings capability gating fidelity

## Classification

- Notifications:
  - Lynx already labels activity toasts and system notifications as unavailable.
  - Classification: intentional runtime capability delta, not a hidden no-op.
- Font smoothing:
  - Web applies WebKit/macOS DOM properties through `useNativeFontSmoothing`.
  - The Lynx engine does not expose that WebKit CSS surface.
  - Previous Lynx behavior still displayed an editable switch that could never affect rendering.
- Time format:
  - Web uses this preference for transcript/diff timestamps.
  - Lynx does not yet render the corresponding transcript timestamp surface.
  - Product-specific dates in Integrations and Automations intentionally use their own formats in both renderers.
  - Previous Lynx behavior displayed an editable selector with no current consumer.

## Fix

- Add an explicit `showTimestampFormat` capability to the shared Appearance composition.
- Web continues to opt into both timestamp format and platform-dependent font smoothing where supported.
- Lynx opts out of both unsupported controls.
- Remove both unavailable entries from Lynx Settings search so hidden rows do not leave dead search targets.
- Preserve the stored projection values; a future supported surface can re-enable either capability without migration.

## Verification

- Web: `bun run test -- src/components/settings/SettingsAppearanceComposition.test.tsx`
  - 1 file passed.
  - 1 test passed.
- Lynx: `bun run test -- src/app/settingsSearch.logic.test.ts src/app/settingsNavigation.test.ts`
  - 2 files passed.
  - 14 tests passed.
- Workspace: `CI=1 bun run build`
  - `6 successful, 6 total`.
  - Web and Lynx were cache misses and both built successfully.
  - The Turbo wrapper remained alive after the success summary and was reclaimed as owned process cleanup.

## Evidence ledger

- `intentional-delta`: task completion toasts and system notifications remain explicitly unavailable in Lynx.
- `product-fix`: unsupported font smoothing and time format controls are no longer presented as functional Lynx settings.
- `product-pass`: Web authority still opts into both shared composition capabilities.
- `product-pass`: Lynx search excludes both hidden controls.
- `native-unverified`: no Native interaction was required or claimed for capability gating.
