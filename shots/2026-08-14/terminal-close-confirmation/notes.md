# Terminal close confirmation fidelity

## Discovery

- `timestampFormat` was audited first.
- Lynx transcripts currently have no timestamp presentation to format.
- Integrations and Automations use the same product-specific date formatting as their Web authority rather than the global transcript timestamp preference.
- Classification: `timestampFormat` is missing feature coverage for a future transcript timestamp surface, not a current cross-renderer product loss.

## Product loss

- Severity: P1 reliability loss.
- Authority: Web reads `confirmTerminalTabClose` and prompts before closing an active terminal.
- Previous Lynx behavior: the real PTY drawer and Workspace terminal always closed the session and permanently cleared its history.

## Fix

- Read `confirmTerminalTabClose` from the canonical Behavior projection at close time.
- Reuse the shared Web `confirmTerminalTabClose` helper and copy.
- Use the existing Lynx Native dialogs port.
- Prompt only when the PTY snapshot reports `running`, the closest available Lynx signal that the session is still active.
- Preserve direct close for exited/error sessions and when confirmation is disabled.
- On cancellation, keep the terminal visible and preserve its session/history.
- Gate the asynchronous confirmation so repeated Close activations cannot open duplicate dialogs or race duplicate closes.

## Verification

- `bun run test -- src/app/TerminalCloseConfirmation.lynx.test.ts src/app/ThreadTerminal.lynx.test.ts src/app/settingsNavigation.test.ts`
  - 3 files passed.
  - 16 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: shared helper tests prove confirmation copy, cancellation, and disabled behavior.
- `product-pass`: terminal contract tests prove canonical setting consumption, active-session gate, and duplicate-confirmation guard.
- `missing-coverage`: the healthy isolated snapshot had no real terminal available through a canonical product path.
- `native-unverified`: no exact-owned Native instance was launched, so Native message-box behavior is not claimed.
