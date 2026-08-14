# Terminal close fallback fidelity

## Classification

- Severity: P1 reliability loss.
- Authority: Web contains structured terminal-close failures and falls back to writing `exit`.
- Previous Lynx behavior:
  - Thread close awaited `terminal.close` from a `void` event handler.
  - A transport/host rejection escaped as an unhandled promise.
  - Workspace deletion swallowed close failure but did not attempt the compatible exit fallback.

## Fix

- Add one shared Lynx terminal cleanup helper.
- Prefer structured close with `deleteHistory: true`.
- Fall back to `exit\r` when structured close fails.
- Contain fallback write failures so UI cleanup and Workspace deletion remain deterministic.
- Reuse the helper from both Thread terminal close and Workspace deletion.

## Verification

- `bun run test -- src/app/terminalSessionCleanup.logic.test.ts src/app/ThreadTerminal.lynx.test.ts src/app/workspaceDeletion.logic.test.ts src/app/WorkspacePage.lynx.test.ts`
  - 4 files passed.
  - 11 tests passed.
  - Covers structured close, exit fallback, dual transport failure containment, and Workspace deletion ordering.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: cleanup helper tests prove both transport paths settle without unhandled rejection.
- `product-pass`: Thread and Workspace surfaces use the same helper.
- `native-unverified`: no exact-owned Native transport failure was induced.
