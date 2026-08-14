# Viewport probe failure fidelity

## Classification

- Severity: P1 root-layout reliability loss.
- Lynx has two resize channels, but the initial host viewport probe had no rejection boundary.
- If the bridge rejected during startup, the promise was unhandled while responsive state remained unknown.

## Fix

- Contain initial `getViewportSize` rejection.
- Keep the documented unknown responsive layout instead of inventing dimensions.
- Preserve both host `viewport:resize` and Lynx `onWindowResize` channels as the real recovery path.
- Preserve unmount cancellation and valid-size filtering.

## Verification

- `bun run test -- src/app/ResponsiveLayout.lynx.test.ts`
  - 1 file passed.
  - 2 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: responsive contract verifies initial probe containment and both resize recovery channels.
- `native-unverified`: no exact-owned Native bridge rejection was induced.
