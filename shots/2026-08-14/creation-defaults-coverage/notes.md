# Creation defaults coverage

## Classification

- Severity: P1 behavior loss.
- Follow-up discovery after Landing defaults:
  - Sidebar Search project creation still hard-coded Codex.
  - Sidebar thread import still hard-coded `envMode: local`.
  - Kanban task fallback model still hard-coded Codex.
  - Kanban task thread creation still hard-coded `envMode: local`.

## Fix

- Keep command builders pure by passing resolved defaults from their UI owners.
- Sidebar Search:
  - new projects use the canonical default provider and its canonical default model.
  - imported threads preserve the imported provider/model identity.
  - imported threads use the canonical default environment mode.
- Kanban:
  - project-specific default model selection remains highest priority.
  - the canonical default provider/model is the fallback.
  - task threads use the canonical default environment mode.
- Preserve existing thread creation recovery and draft cleanup behavior.

## Verification

- `bun run test -- src/components/sidebar/sidebarSearchActions.logic.test.ts src/app/kanbanTaskCreation.logic.test.ts src/app/KanbanNewTaskDialog.lynx.test.tsx src/app/settingsNavigation.test.ts`
  - 4 files passed.
  - 18 tests passed.
  - Includes Kanban create/start/failure recovery and scratch-draft cleanup.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: pure command tests prove provider and environment propagation.
- `product-pass`: Kanban interaction tests preserve persistence and failure recovery.
- `missing-coverage`: no provider-backed task/thread was created in the isolated runtime.
- `native-unverified`: no exact-owned Native instance was launched for this slice.
