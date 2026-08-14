# Automation time initial-value fidelity

## Classification

- Severity: P1 form-state loss.
- Automation Create state defaults to `09:00`.
- The native input was created with the React-style `defaultValue` key instead of Lynx's `default-value` attribute.
- The visible native field could start empty while summary/validation state used `09:00`.

## Fix

- Use the native `default-value` attribute for the time input.
- Preserve the controlled state update from native input events.
- Preserve schedule validation and canonical create payload mapping.

## Verification

- `bun run test -- src/app/AutomationsPage.lynx.test.ts src/app/automationCreate.logic.test.ts`
  - 2 files passed.
  - 8 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: route contract requires the exact native initial-value attribute.
- `product-pass`: schedule/payload tests remain unchanged.
