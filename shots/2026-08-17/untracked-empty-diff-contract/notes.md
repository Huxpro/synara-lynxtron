# Untracked Empty File Diff Contract

## Scope

This loop checked whether an untracked empty file can appear in Git status but
disappear from standalone Changes.

## Evidence

- Real Git `diff --no-index` against `/dev/null` emits:
  - `diff --git a/empty.txt b/empty.txt`;
  - `new file mode 100644`;
  - `index 0000000..e69de29`.
- `GitCore.readUntrackedPatches` uses that exact command shape for each
  untracked file.
- A focused server regression now creates a real empty untracked file and
  verifies all three patch markers survive `readWorkingTreePatch`.
- Focused Vitest:
  `1 passed / 91 skipped`.
- The shared lifecycle projection added in the preceding slice maps this patch
  to `File added.` in Web and Lynx.

## Classification

- `untracked-empty-status-diff-split`: suspected loss `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`; no runtime behavior change was
  required.
- The added regression hardens the server-to-shared-renderer contract against
  future changes to untracked patch synthesis.
- Browser entry and exit gates reported `sessions: []` and zero
  agent-browser-owned processes; no browser session was needed for this
  server-contract loop.
