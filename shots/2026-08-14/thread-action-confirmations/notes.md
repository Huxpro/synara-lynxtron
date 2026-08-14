# Thread action confirmation fidelity

## Classification

- Severity: P1 behavior loss.
- Authority:
  - `confirmThreadDelete` defaults to `true`.
  - `confirmThreadArchive` defaults to `false`.
- Previous Lynx behavior: Sidebar context actions always prompted for both delete and archive, regardless of the saved Behavior preferences. This made the default archive behavior diverge from Web before the user changed any setting.

## Fix

- Read the canonical Behavior projection when a Sidebar context action is selected.
- Pass both confirmation preferences into the pure native thread context helper.
- Return confirmation copy only when the matching action preference is enabled.
- Preserve all existing command construction, Native dialog handling, and post-command invalidation.

## Verification

- `bun run test -- src/components/sidebar/threadContextActions.logic.test.ts src/components/sidebar/SidebarThreadContextMenu.lynx.test.ts src/app/settingsNavigation.test.ts`
  - Rstest matched 2 existing files.
  - 14 tests passed.
  - The requested `SidebarThreadContextMenu.lynx.test.ts` path does not exist and was not counted as a passing file.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: pure logic tests cover pin, archive, and delete with both preference states.
- `product-pass`: production compilation verifies the Sidebar storage projection and helper call path.
- `missing-coverage`: the healthy isolated snapshot had no thread row available for a canonical context-menu interaction.
- `native-unverified`: no exact-owned Native instance was launched, so Native confirmation dialogs are not claimed.
