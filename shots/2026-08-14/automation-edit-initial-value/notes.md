# Automation edit initial-value fidelity

## Classification

- Severity: P1 edit/data loss.
- The Automation edit prompt textarea had no native initial value.
- It relied on a host timer followed by an imperative `setValue`.
- Timer rejection left the prompt visually empty while component state still held the existing prompt, creating confusing first paint and overwrite risk.

## Fix

- Give the native textarea its canonical `default-value`.
- Keep the definition/open effect for React state reset when the dialog reopens or the definition changes.
- Remove the timer, ref, and imperative value injection.
- Preserve keyed native remounting, pending state, validation, and canonical update payload.

## Verification

- `bun run test -- src/app/AutomationsPage.lynx.test.ts src/app/automationCreate.logic.test.ts`
  - 2 files passed.
  - 8 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: Automation routes, create payloads, and edit mutation remain covered.
- `product-fix`: the prompt now renders from canonical definition data without an asynchronous host timer.
