# Settings Worktrees current-head evidence

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

## Identity

- Source base: `31d6a956`
- Lynx-for-Web bundle SHA-256:
  `f14f75c4b231e4c2e45a9658a032e41d587db4cbc6826eb90a58d1093d4a04ab`
- Native bundle SHA-256:
  `49321a734da5da16e26e50efac21610cdad2c6097719a9532003cbb6a2035680`
- SQLite snapshot SHA-256:
  `c5313f03838f0669fc1e8cb558bf7d2d04c86b479bebc3a1559472c740db95a5`
- Route: Settings Worktrees
- Theme: light
- Density: comfortable
- State: canonical empty managed-worktree projection
- Browser viewport: `1280x820`, DPR 1
- Native outer window: `1280x820`
- Native LynxView frame: `2560x1576`, DPR 2

## Delivered parity

Before this slice, Worktrees was excluded from Lynx Settings and had no
transport or mutation path.

The Lynx Worktrees panel now:

- calls the canonical `server.listWorktrees` RPC;
- projects all thread shells with both `worktreePath` and
  `associatedWorktreePath`, without changing active Sidebar semantics;
- groups managed worktrees by workspace root in server order;
- renders linked conversations and the same empty/loading/error copy as Web;
- uses the real host confirmation dialog before deletion;
- deletes linked archived conversations first, then calls the canonical
  `git.removeWorktree` RPC with `force: true`;
- invalidates both managed-worktree and sidebar snapshots in `finally`, so a
  partial failure cannot leave stale deleted conversations in the renderer.

## Geometry

Web / Native:

- content rail: `x=432, y=0, width=672`;
- header: `x=456, y=32, width=624, height=54`;
- empty state: Web `x=456, y=118, 624x70`; Native
  `x=456, y=118, 624x72`;
- Native empty-state text: `219x18`.

All primary anchors match exactly; the empty-state height differs by 2px.

## Capability and safety

The populated projection and destructive transaction are covered by focused
tests because the isolated canonical snapshot has no managed worktree. No
worktree or thread was fabricated directly in SQLite merely to produce a
visual row. Delete remains fully capability-backed and is not an inert visual
control.

The first Native build correctly failed because a query function was not
declared `background only`; the implementation now follows the existing
ReactLynx query boundary instead of weakening the compiler guard.

The final exact-owned Native capture used PID `23666`, its PID-derived
`localhost:8904/session 1`, retained all five required roles, and reported zero
warning/error console messages.

## State cleanup

The Native light-theme capture temporarily changed only the owned
`.p10-view-native` KV file. The app was stopped before restoration, and the
original bytes were restored with SHA-256
`f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.

## Lynx-for-Web correction

An earlier browser capture had hit Vite's SPA fallback instead of the generated Lynx-for-Web host because the staged `/lynx` assets were missing. That evidence was invalidated. The retained frame uses the staged current-head bundle, keeps the host URL under `/lynx/index.html`, and verifies the target `X-VIEW` class after memory-history navigation.
