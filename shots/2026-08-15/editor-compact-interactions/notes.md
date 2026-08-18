# Compact Editor interaction coverage

## Scope and identity

- Newly verified interaction cell: compact Editor activity rail and Chat
  visibility at `390x844`, DPR 1, dark.
- Snapshot: `.synara-fidelity-editor-changes`.
- Project/thread: `editor-changes-project` / `editor-changes-thread`.
- Route/state: `/thread/editor-changes-thread`, `editor=open`,
  `editorMode=diff`.
- Renderer: fresh production Lynx-for-Web bundle.
- Git head: `5f9a360d7aa108d4a0fea9e0ebc80feb960ea98d`.
- Bundle identity:
  - `web-host.js`:
    `a5ca07e6fb314eb3f986cffa26911622d8937aab6b8d0fd6fcd427a1c6a6e577`
  - `main.web.bundle`:
    `3f639897cb9bb278fc7d642108597a3a8636e4a20e70b7543a4d3ad264b30733`
- Snapshot identity at preflight:
  - `dev/state.sqlite`:
    `a08c59bce8458bb4a824fcaefb0ac526bd7d7d615816ad65bb2cb00a5a91457a`
  - `dev/state.sqlite-wal`:
    `93abfdf8e4eb9099c1d465d25b610f4698464e5692f27733e8cddb2ab203da5e`
- Relay remained connected to `ws://127.0.0.1:58090` with one connection,
  zero pending requests, and no transport or RPC error.

## Real interaction results

The retained activity sequence used trusted low-level browser pointer input:

1. Changes -> Files: pass.
2. Files -> Search: pass.
3. Search -> Changes: pass.

The active 48px rail item moved from `y=94` to `y=46`, then `y=142`, and
back to `y=94`. The rendered center changed between `ThreadEditorChanges`,
`ExplorerDock--editor`, and `ExplorerDock--editor-search`; this was not a
programmatic product-state mutation.

The retained Chat sequence dynamically located the visible button text, used
an integer point inside the measured button rectangle, and sent trusted
pointer input:

1. `Hide chat`: pass.
2. Hidden workspace expansion: pass.
3. `Show chat`: pass.
4. Original split restored: pass.

Geometry:

- activity rail: `48x798` at `(0,46)` throughout;
- visible center: `342x498.75` at `(48,46)`;
- visible Chat: `342x299.25` at `(48,544.75)`;
- hidden center: `342x798` at `(48,46)`;
- hidden Chat: `0x0`;
- restored geometry exactly matches the initial geometry.

All seven PNGs are exactly `390x844`. `errors.json` is empty. Console output
contains only the known upstream Web Core deprecated-initialization warning.

## Classification

- **New compact interaction coverage: product pass.**
- `lynx-editor-compact-rail-interaction`: component contribution
  `0.00 -> 0.00`; the prior layout closure now has real interaction evidence.
- `lynx-editor-compact-chat-toggle-interaction`: component contribution
  `0.00 -> 0.00`; hide, expansion, show, and restoration all passed.
- No weighting, filtering, or scope reduction was used. Failed harness samples
  were rejected before product accounting.
- Web authority remains the visual/composition reference from
  `shots/2026-08-14/editor-view/`. A fresh equivalent Web interaction cell is
  still missing because the current isolated Vite authority intermittently
  failed its hydration gate under agent-browser. No Web interaction pass is
  claimed from an empty frame.
- Native remains missing certification coverage. No user-owned Native process
  was reused or stopped.

## Harness exclusions

- The first guarded heredoc did not reach its child because `browser:run`
  backgrounded the command without explicitly inheriting stdin. This harness
  loss was fixed and independently pushed in `5f9a360d7`.
- One Chat selector assumed `Hide Chat`; the real Lynx copy is `Hide chat`.
  The null target was rejected before any product click.
- `agent-browser mouse move` rejected decimal coordinates. The retained run
  rounds the dynamically measured center to an integer and verifies that it
  remains inside the target rectangle before clicking.
- A production-static Web authority attempt was rejected because omitting
  `--dev-url` changes the server state directory from `dev/` to `userdata/`;
  it did not use the shared snapshot.
- Empty or partially hydrated Web authority frames, XPath/CSS selector setup
  failures, and readiness-probe failures were not retained or counted as
  product loss.

## Evidence

- `00-changes.{png,json}`
- `01-files.{png,json}`
- `02-search.{png,json}`
- `03-changes-return.json`
- `chat-visible.json`
- `chat-hidden.{png,json}`
- `chat-restored.json`
- `hide-target.json`
- `show-target.json`
- `errors.json`
- `console.json`

The three omitted PNGs were byte-identical to `00-changes.png` (SHA-256
`b242565f1bc69f1aedf373b4b8ee8453a8482dd6f25ee7650bdb97cefdd3d57b`);
their interaction JSON remains retained, so no distinct visual sample or
behavioral state was removed.
