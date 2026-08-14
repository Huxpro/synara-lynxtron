# Project instructions hydration fidelity

## Classification

- Severity: P1 interaction loss.
- Environment Project Instructions waits for its persisted store before enabling synchronized editing.
- Previous rehydration used a success-only promise handler.
- Storage rejection left `hydrated` false forever, disabling external-store synchronization and normal save lifecycle.
- The debounce timer also had no rejection boundary.

## Fix

- Share one local hydration application path.
- On persistence success, apply the stored project instructions.
- On persistence failure, apply the current in-memory value and complete hydration so editing remains available.
- Contain debounce timer failure; blur, close, or the next edit remains the authoritative flush path.
- Preserve notepad-copy mutation and error state.

## Verification

- `bun run test -- src/app/EnvironmentPanel.lynx.test.tsx src/app/threadPageState.logic.test.ts`
  - 2 files passed.
  - 13 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: Environment capability, ordering, visibility, and thread state contracts remain covered.
- `product-fix`: unavailable persistence no longer locks Project Instructions in an unhydrated state.
