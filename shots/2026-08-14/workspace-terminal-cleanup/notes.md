# Workspace terminal cleanup fidelity

## Classification

- Severity: P1 reliability loss.
- Authority: Web closes every synthetic Workspace terminal and clears its history before deleting the Workspace page.
- Previous Lynx behavior:
  - Workspace metadata was removed from the persisted store.
  - The host-backed `workspace:<id>` / `default` PTY was not closed.
  - A deleted Workspace could leave a background process and terminal history alive.

## Fix

- Add a pure async deletion coordinator.
- Close the synthetic Workspace terminal first with `deleteHistory: true`.
- Delete the persisted Workspace page only after the close attempt settles.
- Treat an already-exited or unreachable terminal as best-effort cleanup: deletion still completes.
- Preserve existing fallback navigation after deletion.

## Verification

- `bun run test -- src/app/workspaceDeletion.logic.test.ts src/app/WorkspacePage.lynx.test.ts src/app/ThreadTerminal.lynx.test.ts`
  - 3 files passed.
  - 9 tests passed.
  - Covers close-before-delete ordering and cleanup failure tolerance.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: logic tests prove exact synthetic thread/terminal identity and destructive history cleanup.
- `product-pass`: Workspace surface contract proves platform terminal cleanup is wired before store deletion.
- `native-unverified`: no exact-owned Native Workspace/PT​​Y instance was created or deleted.
