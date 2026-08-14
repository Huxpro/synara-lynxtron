# Commit message readonly fidelity

## Classification

- Severity: P1 form-state loss.
- The Git action commit message is a raw Lynx textarea.
- Previous running state used React's `readOnly` prop spelling.
- The native textarea contract uses `readonly`, so the field could remain editable while a commit/push action was already using its captured message.

## Fix

- Use the native `readonly` attribute while the Git action is running.
- Preserve initial message, max length, progress, cancellation, and canonical stacked-action payload.

## Verification

- `bun run test -- src/app/EnvironmentPanel.lynx.test.tsx src/app/threadPageState.logic.test.ts`
  - 2 files passed.
  - 13 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: Environment form and capability contracts require the native readonly attribute.
- `product-fix`: running Git actions can no longer diverge from a still-editable commit message field.
