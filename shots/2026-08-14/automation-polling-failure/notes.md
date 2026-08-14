# Automation polling failure fidelity

## Classification

- Severity: P1 reliability loss.
- Previous Lynx polling used `void poll().finally(schedule)`.
- A failed Automation RPC scheduled the next cycle but preserved the rejected promise.
- An offline Automations page could emit an unhandled rejection every polling cycle.
- Host sleep rejection was also not contained.

## Fix

- Contain each polling RPC rejection before scheduling the next cycle.
- Continue polling after recoverable RPC failures.
- Contain host timer rejection and reschedule while the page remains mounted.
- Preserve the cancellation gate so unmounted pages do not schedule more work.

## Verification

- `bun run test -- src/app/AutomationsPage.lynx.test.ts src/app/automationCreate.logic.test.ts`
  - 2 files passed.
  - 8 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: polling source contract forbids the rejection-preserving `finally` path.
- `product-pass`: the canonical Automation query and host polling interval remain unchanged.
- `native-unverified`: no exact-owned Native offline polling run was induced.
