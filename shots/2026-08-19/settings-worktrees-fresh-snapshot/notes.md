# Settings Worktrees Fresh-Snapshot Fidelity

## New Scope

This slice adds a previously unretained Settings state:

- Settings → Worktrees;
- populated managed-worktree inventory;
- no linked conversations at first render;
- a conversation becoming linked after render but before Delete;
- light theme, `1250×896`, DPR `1` for Web and Lynx-for-Web;
- light theme, `1250×896` logical / `2500×1792` physical for Native;
- destructive confirmation Cancel path;
- disconnect-safe association verification.

The server instance was
`836d71a2-ab19-4991-abfc-8728dcc0258f`. Fixtures were created and removed only
through `git.createDetachedWorktree`, `git.removeWorktree`, and canonical
orchestration commands. SQLite was never written directly.

## Classification

Web authority reloads `orchestration.getShellSnapshot` when Delete is
activated, then derives linked active and archived conversations from that
fresh snapshot.

Lynx previously passed `linkedThreads` captured by the render-time query into
the destructive handler. If a thread became linked after render, confirmation
copy and archived-thread cleanup used stale information. If snapshot refresh
failed, deletion could still continue using the stale list.

This was a P1 product data-reliability loss, not a visual mismatch or harness
failure.

## Fix

- The Lynx Delete handler now fetches a fresh sidebar shell snapshot before
  confirmation.
- Confirmation counts and archived-thread deletion use the same fresh
  association list.
- Snapshot failure stops the transaction and renders:
  `Could not verify linked conversations. Retry once the app reconnects to the server.`
- Association filtering is centralized in
  `linkedThreadsForWorktree`, shared by rendering and destructive execution.
- A retry clears the previous verification error before re-reading state.

## Dynamic Outcome

1. The worktree rendered with zero linked conversations.
2. A real `thread.create` command added
   `Fidelity fresh worktree association` with the worktree path after render.
3. The visible Lynx-for-Web Delete control was activated through its real
   shadow-root `X-VIEW`.
4. The confirmation handler returned Cancel and recorded:
   `1 active and 0 archived conversation is linked to this worktree.`
5. The temporary thread and worktree were removed through canonical APIs.
6. Final `server.listWorktrees` returned `[]`; the temporary thread was absent
   from the shell snapshot and both fixture paths were absent on disk.

The full structured outcome is in `interaction.json`.

## Comparable Geometry

Web authority and Lynx-for-Web used the same snapshot, route state, theme,
viewport, and DPR.

| Element     | Web                        | Lynx-for-Web               |
| ----------- | -------------------------- | -------------------------- |
| row         | `622×106 @ (442,151)`      | `622×106 @ (442,151)`      |
| Delete      | `47.89×24 @ (1004.11,161)` | `47.89×24 @ (1004.11,161)` |
| row padding | `10px 12px`                | `10px 12px`                |

Native reported a `598×86` content box at `(517,160)` and a `48×24` Delete
button at `(1067,160)`. Its coordinates are in the Lynx content frame rather
than the browser viewport; the outer Native image remained the expected
`2500×1792` at DPR `2`.

## Harness Separation

- Initial browser selectors searched document light DOM and could not see the
  Lynx-for-Web `X-VIEW` controls. Recursive shadow-root inspection resolved
  the real rendered control. This was a harness selector mismatch and did not
  count as product loss.
- One Native geometry file was initially malformed by evidence serialization.
  It was regenerated from the same PID-derived exact client without changing
  product state or screenshots.
- A later Web geometry retry raced managed-worktree retention and observed an
  empty inventory. It was rejected; the retained screenshot and geometry come
  from the earlier identity-verified populated cell.
- Lynx-for-Web console contains only the named upstream initialization
  deprecation. Web page errors and exact Native error/warning console are
  empty.

## Verification

- focused Settings Worktrees tests: `8/8`;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- staged Native bundle SHA-256:
  `a9baa63f49ba6c8eea793446000fd031e0412cf70a6b3d797ebf5ae3e5d1e50b`;
- staged desktop main SHA-256:
  `a20fd3cc6f1bd223a5bfc9c954ff99b89f6e1d924b48349445c2b2a8f214e8fb`;
- final exact-owned Native PID: `43937`;
- PID-derived client: `localhost:8903`, session `1`;
- Web/Lynx PNG dimensions: `1250×896`;
- Native PNG dimensions: `2500×1792`;
- local `shots/` image count: `100`.

## Evidence

- `web/populated-light-1250x896.png`
- `web/geometry.json`
- `web/errors.json`
- `web/console.json`
- `lynx/populated-light-1250x896.png`
- `lynx/geometry.json`
- `lynx/errors.json`
- `lynx/console.json`
- `native/populated-light-1250x896@2x.png`
- `native/geometry.json`
- `native/row.json`
- `native/sessions.json`
- `native/console.json`
- `interaction.json`
- `loss.json`

Three historical editor-interaction PNGs were removed because all three were
byte-identical to the retained `00-changes.png`; their distinct interaction
JSON remains. No unique visual state was filtered, and no weight or scope was
changed.

## Residual

- Native host dialog copy was not extracted from an inactive background
  system modal in this slice. Native rendering, exact-client identity, and
  click-time RPC behavior are certified; the dialog-copy cell remains
  missing coverage, not a product loss.

## Ledger Outcome

- fidelity loss: `11.3771 → 11.2386`;
- loss delta: `-0.2445`;
- Web/Lynx visual parity: `99.6792%`;
- component contribution:
  - visual: `-0.1643`;
  - scope: `-0.0638`;
  - completeness: `-0.0164`;
  - reliability: `0`;
- accepted pair count: `448`;
- rejected pair count remained `1`;
- no regression change was recorded.
