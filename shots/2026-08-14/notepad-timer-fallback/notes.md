# Notepad timer fallback fidelity

## Classification

- Severity: P1 data-reliability loss.
- Thread Notepad debounces canonical metadata writes through the host timer.
- Previous timer rejection leaked a promise and skipped the automatic save.
- Blur remained a fallback, but edits could stay unsaved indefinitely while focus remained in the Notepad.

## Fix

- Contain debounce timer rejection.
- If the failed timer still owns the current generation, immediately flush the latest notes.
- Preserve stale-generation suppression.
- Preserve in-flight retry, local-echo reconciliation, blur flush, and visible save error state.

## Verification

- `bun run test -- src/app/EnvironmentPanel.lynx.test.tsx src/app/threadPageState.logic.test.ts`
  - 2 files passed.
  - 13 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: Environment and thread-state contracts remain covered.
- `product-fix`: timer failure now preserves the latest canonical Notepad write.
