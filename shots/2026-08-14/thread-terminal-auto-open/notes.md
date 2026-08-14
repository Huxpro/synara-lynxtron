# Thread terminal first-open fidelity

## Classification

- Severity: P1 interaction loss.
- Authority: Opening a terminal surface creates or attaches its host PTY.
- Previous Lynx behavior:
  - Workspace terminal passed `autoOpen`.
  - Thread drawer omitted it.
  - The first Terminal click showed a static `Terminal ready.` shell without calling canonical `terminal.open`.
  - Refresh or Run was required to create the real PTY.

## Fix

- Enable the existing `ThreadTerminal` auto-open contract for the thread drawer.
- Reuse the same guarded open effect as Workspace.
- Preserve the per-thread/terminal/workspace attempt key, pending state, error state, and retry behavior.

## Verification

- `bun run test -- src/app/ThreadTerminal.lynx.test.ts src/app/WorkspacePage.lynx.test.ts src/app/workspaceDeletion.logic.test.ts`
  - 3 files passed.
  - 9 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: source contract proves both terminal entry points use the same canonical auto-open behavior.
- `native-unverified`: no exact-owned Native thread/PT​​Y instance was opened.
