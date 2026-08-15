# Compact Kanban card actions

## Scope and identity

- Newly exercised combination: populated project board × compact `390x844` ×
  DPR 1 × dark × card overflow action × chooser cancel.
- Renderer: fresh production Lynx-for-Web bundle.
- Snapshot: `.synara-fidelity-editor-changes`, served from the canonical
  `dev/` state directory through `ws://127.0.0.1:58090`.
- Project: `editor-changes-project`; route title: `Editor Changes`.
- The board contained the same two durable threads used by the earlier
  populated Kanban cell:
  - `editor-changes-thread` — `Editor changes review`;
  - `editor-history-thread` — `Review chat history navigation`.
- Bundle identity:
  - `main.web.bundle`:
    `d1982d26f7765cb39f5ae3ddbee0862074a1b4a50f4ec557da9debbab0adf209`;
  - `web-host.js`:
    `a5ca07e6fb314eb3f986cffa26911622d8937aab6b8d0fd6fcd427a1c6a6e577`.

## Interaction result

- Trusted low-level pointer input activated the first rendered
  `Actions for Editor changes review` control.
- Before opening:
  - first card: `248x64.5 @ (20,94)`;
  - action trigger: `24.984375x18 @ (230.015625,105)`.
- The product-owned `Task actions` chooser opened as
  `358x118 @ (16,56)`, fully contained inside the `390px` viewport.
- The chooser exposed the expected shared mutation policy:
  - `Start task`: `78.421875x28`;
  - `Rename task`: `96.21875x28`;
  - `Archive task`: `93.34375x28`;
  - `Cancel`: `61.65625x28`.
- Opening the in-flow chooser moved the first card from `y=94` to `y=222`.
  Trusted pointer input on the rendered `Cancel` button removed the chooser and
  restored both cards exactly to `y=94` and `y=166.5`.
- Read-only semantic snapshots of `projection_threads` are byte-identical
  before and after: three durable threads, unchanged titles, pin state,
  archive state, and deletion state. No mutation action was selected.
- Page errors are empty. Console output contains only the known upstream Web
  Core deprecated-initialization warning.
- Relay diagnostics show one open connection, zero pending requests, no
  transport/RPC error, and only read-side shell/sidebar snapshot tags.
- All three retained PNGs are exactly `390x844`.

## Classification

- The initial cell exposed a real P2 functional parity loss. Web's card action
  policy included Pin/Unpin, Copy Path, Copy Thread ID, and Delete, while the
  Lynx visible action exposed only Start, Rename, and Archive despite already
  having the required clipboard, confirmation, pin, and delete platform ports.
- The complete card-action policy now lives in shared
  `kanbanMutation.logic.ts`. Web's context menu and Lynx's visible chooser
  consume the same order, labels, destructive metadata, and capability gates.
- Post-fix, the same durable Draft card exposes eight contained controls:
  Start task, Rename task, Pin thread, Copy Path, Copy Thread ID, Archive task,
  Delete, and Cancel. The chooser is `358x154 @ (16,56)` and ends at `x=374`.
- Live In Progress cards intentionally omit Archive and Delete, matching the
  existing Native sidebar safeguard against destructive actions during live
  work. Local-only and thread-backed draft deletion retain their separate
  draft-store semantics.
- Trusted pointer input performed a canonical Pin -> refresh -> Unpin round
  trip:
  - Pin emitted `orchestration.dispatchCommand`, rendered one
    `SharedKanbanCardPin`, and changed the action to `Unpin thread`;
  - Unpin emitted a second dispatch, removed the pin, closed the chooser, and
    restored the read-only thread projection exactly.
- `lynx-kanban-card-action-capability-parity`: P2 component contribution
  `1.00 -> 0.00`.
- `lynx-kanban-compact-card-actions-open-cancel`: new P2 interaction coverage,
  component contribution `0.25 -> 0.00`.
- The Lynx trigger's measured `24.984375x18` hit box is retained as an
  observation, not scored as product loss. A valid populated Web authority cell
  was not available for direct comparison, and the current design source is
  compact on both renderers. No speculative size patch was made.
- No weighting, valid-sample filtering, or scope reduction was used.
- Native card actions remain missing certification coverage.

## Harness exclusions

- The first cancel probe searched only browser `role=button`/`button` nodes.
  Lynx-for-Web exposes the shared button as `x-view.LxButton`, so the null
  target was rejected before any product classification. A shadow-tree probe
  found the real `61.65625x28` control and the retained run used its measured
  center.
- Two Web authority startup attempts were rejected before comparison:
  - one navigated after the Vite process had already exited during dependency
    optimization;
  - one probed `127.0.0.1:8891` while Vite was listening on `localhost`.
- A corrected split server/Vite run loaded the canonical route and had no page
  errors, but hydrated an empty Web board (`0 tasks`) while the same server
  snapshot produced two Lynx cards. The frame did not satisfy the same-state
  gate and is recorded as the existing Web authority hydration harness blocker,
  not as a product loss or Web pass.
- Every browser attempt ran through `bun run browser:run -- ...`. Final
  `agent-browser session list` was empty, no agent-browser-owned Chromium
  remained, and owned `58090`, `8080`, and `8891` listeners were released.

## Evidence

- `00-before.{png,json}`
- `01-open.{png,json}`
- `02-closed.{png,json}`
- `action-buttons.json`
- `open-dom.json`
- `threads-before.json`
- `threads-after.json`
- `errors.json`
- `console.json`
- `bundle.sha256`
- `after/00-open.{png,json}`
- `after/01-pinned.{png,json}`
- `after/02-reopen.json`
- `after/03-restored.{png,json}`
- `after/threads-before.json`
- `after/threads-after.json`
- `after/errors.json`
- `after/console.json`
- `after/bundle.sha256`
