# Temporary thread cleanup fidelity

## Classification

- Temporary marking itself matches Web's client-side lifecycle: a marked thread is deleted when its route departs.
- Severity: P1 failure-boundary loss.
- Previous Lynx cleanup used `void dispatch(...).finally(...)`.
- When delete failed, `finally` invalidated queries but preserved the rejected promise, producing an unhandled cleanup rejection during route unmount.

## Fix

- Add one best-effort temporary-thread deletion coordinator.
- Contain dispatch failure.
- Always attempt thread and Sidebar projection invalidation.
- Contain invalidation failure as well, because route cleanup must never leak a promise rejection.
- Preserve the existing canonical `thread.delete` command and departure-only policy.

## Verification

- `bun run test -- src/app/temporaryThreadLifecycle.failure.test.ts src/app/temporaryThreadLifecycle.lynx.test.ts src/app/EmptyThreadContextTray.lynx.test.tsx`
  - 3 files passed.
  - 7 tests passed.
  - Covers successful cleanup, delete failure, invalidation failure, initial temporary state, toggle policy, and departure policy.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: cleanup tests prove failures settle without an unhandled rejection and invalidation is still attempted.
- `native-unverified`: no exact-owned Native temporary-thread departure was executed.
