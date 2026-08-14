# New-thread defaults fidelity

## Classification

- Severity: P1 behavior loss.
- Authority:
  - `defaultProvider` controls the fallback provider for new conversations and projects.
  - `defaultThreadEnvMode` controls whether a new thread uses the local checkout or a worktree.
- Previous Lynx behavior:
  - Landing fallback model selection hard-coded Codex.
  - New project defaults hard-coded Codex.
  - `thread.create` hard-coded `envMode: local`.
  - Both settings could be saved in Lynx but did not affect the canonical creation command.

## Fix

- Read the canonical General projection at Landing composer mount.
- Preserve precedence:
  1. explicit route/provider override
  2. selected project default model
  3. home project default model
  4. saved default provider
- Use the resolved provider for fallback model selection and all Landing-created project defaults.
- Fetch server settings with the Landing bootstrap and apply the server-authoritative `defaultThreadEnvMode` override through the shared projection.
- Pass the resolved environment mode into canonical `thread.create`.
- Keep existing coalescing, ambiguous-response recovery, and post-send invalidation behavior.

## Verification

- `bun run test -- src/components/composer/landingComposerFidelity.test.ts src/components/composer/landingThreadCreation.logic.test.ts src/app/settingsNavigation.test.ts`
  - 3 files passed.
  - 16 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: source contracts prove provider precedence, server settings hydration, and removal of hard-coded Codex/local creation values.
- `product-pass`: thread creation tests preserve single-create and recovery semantics.
- `missing-coverage`: the isolated runtime had no executable provider, and no synthetic provider turn was sent to manufacture a thread.
- `native-unverified`: no exact-owned Native instance was launched for this slice.
