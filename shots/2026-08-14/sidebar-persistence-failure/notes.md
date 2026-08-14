# Sidebar persistence failure fidelity

## Classification

- Severity: P1 reliability loss.
- Sidebar list hydration and sort persistence both used success-only storage promise chains.
- Read failure emitted an unhandled rejection instead of retaining initialized Sidebar defaults.
- Write failure emitted an unhandled rejection even though the selected sort order was already active in the session.

## Fix

- Contain persisted Sidebar-list read rejection and keep initialized expansion, paging, and pin defaults.
- Contain sort storage import/write rejection and keep the immediate sort selection.
- Preserve canonical app-settings projection writes when storage is available.
- Leave durable storage error/retry presentation to Settings hydration.

## Verification

- `bun run test -- src/adapters/SidebarListSectionHeaderElements.lynx.test.tsx src/app/sidebarBootstrap.lynx.test.ts src/components/sidebar/sidebar.logic.test.ts`
  - 3 files passed.
  - 17 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: sort projection, ordering, pin merging, paging, and route state remain covered.
- `product-fix`: unavailable storage no longer leaks promise rejection or disables Sidebar use.
