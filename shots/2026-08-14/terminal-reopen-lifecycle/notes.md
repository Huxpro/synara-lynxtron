# Terminal reopen lifecycle fidelity

## Classification

- Severity: P1 interaction loss.
- After enabling thread terminal auto-open, the close path still left `autoOpenAttemptKeyRef` set.
- Reopening the same thread/terminal/workspace tuple was treated as an already-attempted open and skipped the host call.
- The drawer returned to a static empty shell instead of creating a new PTY.

## Fix

- Clear the guarded auto-open attempt key when close cleanup settles.
- Reset it alongside the snapshot, command, error, and pending state.
- Preserve duplicate-open protection while one terminal surface remains mounted.

## Verification

- `bun run test -- src/app/ThreadTerminal.lynx.test.ts src/app/WorkspacePage.lynx.test.ts src/app/workspaceDeletion.logic.test.ts`
  - 3 files passed.
  - 9 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: close contract now resets the auto-open lifecycle guard.
- `native-unverified`: no exact-owned Native close/reopen cycle was executed.
