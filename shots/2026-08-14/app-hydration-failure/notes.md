# App hydration failure fidelity

## Classification

- Severity: P0/P1 startup loss.
- `storageReady` gates the entire product router.
- Previous App startup used a success-only `Promise.all` around storage, draft, Workspace, and optional thread bootstrap work.
- Appearance/storage rehydration rejection prevented `storageReady` from becoming true, leaving the whole UI on `Preparing Synara…`.

## Fix

- Add a pure persisted-appearance fallback reader.
- Preserve hydrated appearance and theme state on success.
- Use canonical Appearance and Theme defaults when storage/draft/Workspace hydration fails.
- Complete `storageReady` so the router and Settings recovery surfaces remain available.
- Preserve independent thread-bootstrap fallback and unmount cancellation.

## Verification

- `bun run test -- src/app/appHydration.logic.test.ts src/app/appTheme.logic.test.ts src/app/WorkspacePage.lynx.test.ts`
  - 3 files passed.
  - 10 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: persisted state success and failure both settle.
- `product-pass`: canonical theme projection and Workspace hydration contracts remain intact.
- `product-fix`: a storage failure no longer blocks the full application shell.
