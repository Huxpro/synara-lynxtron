# Update failure-state fidelity

## Classification

- Severity: P1 reliability loss.
- Previous Lynx behavior:
  - rejected update checks left the page permanently in `Checking…`.
  - the rejected promise was unhandled.
  - rejected download-page opens were also unhandled and invisible.

## Fix

- Add a deterministic update-check state projector.
- Convert check rejection into a visible, retryable error state.
- Keep the Check button enabled again after failure.
- Catch download-page open rejection and display it separately.
- Preserve successful release metadata and updater-returned error presentation.

## Verification

- `bun run test -- src/app/UpdatePage.test.ts`
  - 1 file passed.
  - 3 tests passed.
  - Covers success, check rejection, and visible download rejection wiring.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: update-check rejection settles into retryable page state.
- `product-pass`: download open failure is contained and visible.
- `native-unverified`: no exact-owned Native updater failure was induced.
