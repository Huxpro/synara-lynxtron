# Provider picker settings fidelity

## Classification

- Severity: P1 behavior loss.
- Authority: Web filters and orders composer providers using `hiddenProviders` and `providerOrder`, while keeping the active provider visible.
- Previous Lynx behavior: Settings → Providers persisted visibility and order, but `ComposerModelControl` called the shared picker helper without either preference.

## Fix

- Read the canonical normalized Provider picker projection in the Lynx composer model control.
- Pass `hiddenProviders` and `providerOrder` into the existing shared `buildComposerProviderPickerItems` helper.
- Preserve `protectedProviders: [activeProvider]`, so hiding a provider cannot make the current thread's selected provider disappear.
- Preserve existing live availability, authentication labels, model catalogs, and favorite-model behavior.

## Verification

- Lynx: `bun run test -- src/components/composer/ComposerProviderPickerSettings.lynx.test.ts src/app/settingsNavigation.test.ts`
  - 2 files passed.
  - 12 tests passed.
- Shared Web helper: `bun run test -- src/components/chat/ComposerProviderPickerItems.test.ts`
  - 1 file passed.
  - 3 tests passed.
  - Covers hidden filtering, configured order, and active-provider protection.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: canonical projection wiring is covered at the Lynx owner.
- `product-pass`: shared helper tests prove filtering, order, and protected-provider semantics.
- `missing-coverage`: the isolated runtime had no usable provider catalog, so an empty picker screenshot was not retained as evidence.
- `native-unverified`: no exact-owned Native instance was launched for this slice.
