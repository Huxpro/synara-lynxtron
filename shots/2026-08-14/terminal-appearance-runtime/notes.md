# Terminal appearance runtime fidelity

## Classification

- Severity: P1 product loss.
- Authority: Web applies `terminalFontSizePx` and `terminalFontFamily` to its terminal runtime.
- Previous Lynx behavior: Settings → Appearance persisted both values, but the real Lynx PTY snapshot surface hard-coded `12px` and `"SFMono-Regular"` for output and command input.
- Scope:
  - thread terminal drawer
  - primary Workspace terminal

## Fix

- Reuse the complete `SettingsAppearanceValues` runtime state introduced at the app boundary.
- Pass terminal font size and family through both terminal entry points.
- Resolve one shared style for output and native command input.
- Preserve the existing Lynx SF Mono stack when the configured family is empty.
- Preserve free-form configured font stacks.
- Normalize terminal size through the canonical Appearance bounds (`10–22px`) and derive line height at the existing `1.5` ratio.

## Verification

- `bun run test -- src/app/terminalAppearance.logic.test.ts src/app/ThreadTerminal.lynx.test.ts src/app/TranscriptAppearance.lynx.test.ts`
  - 3 files passed.
  - 8 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: resolver tests prove fallback, free-form family, canonical bounds, and line-height derivation.
- `product-pass`: source contract tests prove both thread and Workspace terminals consume the same appearance projection and apply the same style to output and command input.
- `missing-coverage`: the healthy isolated real snapshot used for this loop had no project, populated thread, or Workspace terminal available through the canonical product path.
- `native-unverified`: no exact-owned Native instance was launched for this slice.
