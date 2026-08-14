# External navigation fallback fidelity

## Classification

- Severity: P1 platform reliability loss.
- Markdown links, PR checks/comments, provider docs, and several Environment actions fire external navigation without owning an error UI.
- Previous callers used `void platformWindow.openExternal(...)`.
- Host rejection escaped as an unhandled promise across every such surface.
- Callers with visible error state (Repository, Profile share, PDF open) intentionally remain awaited and unchanged.

## Fix

- Add one platform-level `openExternalBestEffort` helper.
- Contain host rejection.
- Route generic `openWindow` through the same helper.
- Migrate fire-and-forget Markdown, PR, provider, and Environment actions.
- Preserve awaited boolean/error behavior for surfaces that own visible feedback.

## Verification

- `bun run test -- src/platform/window.test.ts src/app/SettingsProviderToolsPanel.lynx.test.tsx src/adapters/PullRequestDetailCloseCompositionElements.lynx.test.tsx src/adapters/PullRequestSummaryDisclosure.lynx.test.tsx src/components/markdown/ChatMarkdown.lynx.test.tsx src/app/EnvironmentPanel.lynx.test.tsx`
  - 6 files passed.
  - 26 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: Markdown, PR, provider-tools, and Environment interaction contracts remain covered.
- `product-fix`: generic external navigation no longer emits unhandled host rejection.
