# Cold-route hydration failure fidelity

## Classification

- Severity: P1 startup loss.
- The restore/create controller runs only after `lastRouteHydrated` becomes true.
- Previous Lynx storage reading used a success-only promise handler.
- A storage hydration/read failure left `lastRouteHydrated` false forever, blocking remembered-route restore and fresh Landing fallback.

## Fix

- Add a pure persisted-route fallback reader.
- Preserve a valid remembered route when storage succeeds.
- Convert storage failure into `null` rather than a rejected promise.
- Complete the hydration gate with `null`, allowing the existing restore-or-create controller to open a fresh Landing route.
- Preserve unmount cancellation before state writes.

## Verification

- `bun run test -- src/app/routerPersistenceFailure.test.ts src/app/sidebarBootstrap.lynx.test.ts src/app/studioRoute.logic.test.ts`
  - 3 files passed.
  - 6 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: success and storage-failure route reads both settle.
- `product-pass`: Sidebar bootstrap and Studio restore policy remain intact.
- `native-unverified`: no exact-owned Native storage failure was induced.
