# Shell bridge initialization fidelity

## Classification

- Severity: P1 host-integration reliability loss.
- Router and Sidebar dynamically load shell bridge subscriptions.
- Previous imports used success-only promise handlers.
- Bridge module load failure leaked promises even though local memory-history and pointer/tap navigation remained usable.

## Fix

- Contain Router shell event initialization failure.
- Preserve memory-history navigation without host route/history/menu events.
- Contain Sidebar shell accelerator initialization failure.
- Preserve Sidebar pointer/tap actions without application-menu accelerators.
- Preserve all disposer cleanup when bridge initialization succeeds.

## Verification

- `bun run test -- src/app/threadTranscriptPolling.lynx.test.ts src/app/settingsNavigation.test.ts src/components/sidebar/sidebar.logic.test.ts`
  - 3 files passed.
  - 27 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: startup route, transcript polling, Settings, Sidebar routing, ordering, pins, and paging remain covered.
- `product-fix`: missing shell integration now degrades to local navigation without unhandled rejection.
