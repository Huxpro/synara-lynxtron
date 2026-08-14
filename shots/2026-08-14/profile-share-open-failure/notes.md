# Profile share open failure fidelity

## Classification

- Severity: P1 interaction feedback loss.
- Profile image copy already projected success/failure.
- Social share then opened an external URL through a nested success-only promise chain.
- A host `false` result or rejection was invisible and could leak a promise.

## Fix

- Keep image-copy behavior unchanged.
- Await the platform external-open result.
- Treat both `false` and rejection as failure.
- Reuse the existing visible `shareStatus` error surface.
- Contain the event-handler promise with explicit `void` activation.

## Verification

- `bun run test -- src/app/SettingsProfilePanel.lynx.test.tsx`
  - 1 file passed.
  - 5 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: Profile stats, edit, export, and share host contracts remain covered.
- `product-fix`: failed external navigation is visible and no longer leaks rejection.
