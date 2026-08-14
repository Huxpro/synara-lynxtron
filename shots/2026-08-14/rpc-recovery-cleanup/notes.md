# RPC recovery cleanup fidelity

## Classification

- Severity: P1 transport reliability loss.
- Connection and background-recovery promises both use `finally` to clear in-flight identity.
- The connection cleanup already contained the derived `finally` rejection.
- Background recovery did not, so a timer/connect failure could emit an unhandled rejection even though recovery state was cleared.

## Fix

- Contain the derived background-recovery cleanup promise.
- Preserve recovery identity clearing.
- Preserve bounded reconnect, offline cooldown, active-socket invalidation, and future recovery restart behavior.
- Add a contract that both pending cleanup chains contain their derived rejections.

## Verification

- `bun run test -- src/data/rpcTransport.logic.test.ts`
  - 1 file passed.
  - 10 tests passed.
  - Covers timeout, mid-RPC close, bounded backoff, proactive recovery, cooldown, stream order, and cleanup chains.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: transport manager recovery behavior remains fully covered.
- `product-fix`: background cleanup no longer creates an unobserved rejected promise.
