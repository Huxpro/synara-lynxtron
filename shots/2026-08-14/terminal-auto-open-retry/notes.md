# Terminal auto-open retry fidelity

## Classification

- Severity: P1 recovery loss.
- The auto-open attempt key prevents duplicate host opens while a surface is mounted.
- Previous failure handling retained that key even though no snapshot was created.
- Hiding and reopening the same thread/terminal tuple skipped every future host open attempt.

## Fix

- Clear the attempt key when auto-open fails.
- Preserve the visible error state.
- Preserve the key after successful open while a snapshot is attached.
- Preserve close cleanup resetting the key for a fresh PTY.

## Verification

- `bun run test -- src/app/ThreadTerminal.lynx.test.ts src/app/WorkspacePage.lynx.test.ts src/app/terminalSessionCleanup.logic.test.ts`
  - 3 files passed.
  - 9 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: terminal open, close, cleanup fallback, and both entry points remain covered.
- `product-fix`: a failed auto-open can be retried for the same terminal identity.
