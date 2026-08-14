# Environment preference persistence failure

## Classification

- Severity: P1 reliability follow-up.
- The Environment header toggle applies an immediate session override and persists `environmentPanelDefaultOpen`.
- Previous persistence used a success-only dynamic-import chain.
- Storage import/write rejection escaped as an unhandled promise even though the visible session state had already changed.

## Fix

- Contain storage import and write rejection.
- Preserve the explicit session override.
- Leave durable storage error/retry presentation to Settings hydration, its existing owner.
- Preserve the canonical General projection merge.

## Verification

- `bun run test -- src/app/EnvironmentPanel.lynx.test.tsx src/app/threadPageState.logic.test.ts`
  - 2 files passed.
  - 13 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: default-open policy, projection merge, and session override remain covered.
- `product-fix`: storage failure no longer leaks an unhandled rejection.
