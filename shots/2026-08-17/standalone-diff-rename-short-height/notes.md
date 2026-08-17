# Standalone Rename Changes at 320x200

## Newly discovered scope

A real staged rename-only working-tree diff was opened in standalone Changes
at `320x200`, DPR 1, dark:

- canonical operation:
  `git mv old/name.txt new/renamed.txt`;
- canonical patch:
  `similarity index 100%`,
  `rename from old/name.txt`,
  `rename to new/renamed.txt`;
- `git.readWorkingTreeDiff` confirmed the staged rename is included by the
  Changes data source;
- entry and expansion used real browser mouse input.

## Runtime evidence

- file card: `271x34 @ (25,142)`;
- new path:
  `new/renamed.txt`, `74.5625x16 @ x=56..130.5625`;
- previous path:
  `from old/name.txt`, `100.078125x16 @ x=138.5625..238.640625`;
- gap between identities: `8px`;
- overlap: `0`;
- both labels remained complete inside the compact header;
- root `scrollWidth=320`;
- relay: `pendingRequests=0`, no RPC/transport error;
- page errors: none.

## Classification

- `standalone-diff-rename-identity`: missing coverage `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`; no code change was required.
- The first direct RPC probe returned no visible stdout and was rejected as a
  suspicious harness result. A second explicit JSON probe confirmed the
  canonical patch before UI evidence was collected.
- Every browser workflow ran through `bun run browser:run -- ...`.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  removed state/workspace, and repository screenshot count `100`.
