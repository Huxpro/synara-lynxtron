# Diff word wrap runtime fidelity

## Classification

- Severity: P1 product loss.
- Authority: Web applies `diffWordWrap` when a diff panel opens.
- Previous Lynx behavior: Settings → Behavior persisted `diffWordWrap`, but the working-tree Changes dock always rendered the shared PR code composition in horizontal-scroll mode.
- Scope: raw and per-file working-tree patches in the Lynx Changes dock.

## Fix

- Read `diffWordWrap` from the canonical Behavior storage projection when `DiffDock` mounts.
- Add an optional `wordWrap` field to the host-neutral `PullRequestCodeComposition` contract.
- Pass the policy to both line-container and line elements.
- Web host:
  - wrapped mode hides horizontal overflow and uses `whitespace-pre-wrap`.
  - scroll mode preserves the previous `overflow-x-auto` / `whitespace-pre` behavior.
- Lynx host:
  - wrapped mode replaces the horizontal `scroll-view` with a normal view.
  - wrapped rows drop the forced minimum content width and use `white-space: pre-wrap`.
  - scroll mode preserves the previous horizontal list behavior.
- Pull-request pages omit the optional prop and retain their prior scroll behavior; the setting applies only to the working-tree Changes surface, matching its existing Web scope.

## Verification

- `bun run test -- src/app/DiffWordWrap.lynx.test.ts src/adapters/PullRequestCodeDisclosure.lynx.test.ts src/app/settingsNavigation.test.ts`
  - 3 files passed.
  - 15 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: contract tests prove canonical storage consumption and the shared composition boundary.
- `product-pass`: Web and Lynx host tests prove explicit scroll-versus-wrap rendering policies.
- `missing-coverage`: the healthy isolated real snapshot had no workspace or working-tree diff available through a canonical product path, so no synthetic long-line fixture or screenshot was retained.
- `native-unverified`: no exact-owned Native instance was launched for this slice.
