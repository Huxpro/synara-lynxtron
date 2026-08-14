# Recap preparation failure fidelity

## Classification

- Severity: P1 failure-state loss.
- Recap generation already displayed an error state for generation failures.
- The earlier preparation and idle-timer stages lived outside that error boundary.
- A preparation/timer rejection leaked a promise and left the recap without its existing retry/error presentation.

## Fix

- Put preparation, idle delay, and generation into one promise error boundary.
- Reuse the existing `generationState: error` UI.
- Preserve generation tokens so stale failures cannot overwrite a newer request.
- Preserve cancellation when the Environment panel closes or the revision changes.

## Verification

- `bun run test -- src/app/EnvironmentPanel.lynx.test.tsx src/app/threadPageState.logic.test.ts`
  - 2 files passed.
  - 13 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: Environment ordering, capability, visibility, and thread-state contracts remain covered.
- `product-fix`: every recap generation stage now settles into the existing visible error state.
