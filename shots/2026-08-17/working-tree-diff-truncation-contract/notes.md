# Working Tree Diff Truncation Contract

## Scope

The standalone Changes renderer currently passes `truncated={false}` to the
shared portable diff composition. This loop audited whether the server can
return a silently truncated working-tree patch that would make that UI
contract incorrect.

## Contract evidence

- `GitReadWorkingTreeDiffResult` contains only `patch: string`; it does not
  expose a truncation flag.
- `GitCore.collectOutput` counts bytes and throws `GitCommandError` as soon as
  command output exceeds its configured limit.
- The error detail explicitly says the command output exceeded the limit and
  was truncated, but the partial text is not returned to the caller.
- Working-tree, staged, and unstaged patch reads all use this fail-closed
  execution path.
- Branch patch reads use the same path with an explicit `10,000,000` byte
  limit.
- `GitManager.readWorkingTreeDiff` forwards the successful complete patch or
  the typed failure; it does not convert an output-limit failure into a
  partial success.

## Classification

- `working-tree-diff-silent-truncation`: suspected product loss
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`; no code change was required.
- The correct user-visible boundary for oversized output is the already
  verified `Couldn’t load changes.` / Retry state, not a truncation banner on
  a partial patch.
- No large fixture was retained because the implementation contract proves
  that a partial response cannot cross the RPC boundary.

## Browser lifecycle

- The loop entry cleanup reported `sessions: []` and zero
  agent-browser-owned processes.
- No browser session was needed for the source-to-contract audit.
