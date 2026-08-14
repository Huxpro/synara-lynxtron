# Automation provider default fidelity

## Classification

- Severity: P1 creation loss.
- Authority: Automation creation uses the selected project's default model when available, otherwise the app's default provider/model.
- Previous Lynx behavior:
  - Projects without `defaultModelSelection` produced `modelSelection: null`.
  - The Create button remained disabled even when every visible field was valid.
  - Saving a default provider did not make those projects usable for Automation creation.
- `worktreeMode: auto` already matches Web Automation policy and was intentionally unchanged.

## Fix

- Read the canonical General projection in the Automation dialog.
- Preserve project `defaultModelSelection` as highest priority.
- Fall back to the canonical default provider and its canonical default model.
- Remove the false requirement that a project must already persist a model selection.
- Preserve schedule, approval-required runtime, interaction mode, worktree policy, retry policy, and completion policy.

## Verification

- `bun run test -- src/app/AutomationsPage.lynx.test.ts src/app/automationCreate.logic.test.ts src/app/settingsNavigation.test.ts`
  - 3 files passed.
  - 19 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: route contract verifies project-first/global-fallback precedence and no hard-coded model slug.
- `product-pass`: payload tests preserve canonical schedule and policy fields.
- `missing-coverage`: no live Automation was created because the isolated runtime had no executable provider.
- `native-unverified`: no exact-owned Native instance was launched for this slice.
