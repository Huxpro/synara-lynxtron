# Native Diff File Jump Close Paths

## Newly Discovered Scope

An exact-owned Native cell exercised the two pointer-owned dismiss paths of
the file-jump overlay:

1. explicit Close button;
2. backdrop.

The canonical state reused the real two-file working-tree diff with a
30-replacement-line first file, one-line second file, and `2537` patch bytes.
The first file was expanded before each overlay open so accidental underlying
state mutations would be visible.

## Harness Identity

- Source commit: `f99884c381c6e941fbfb34d08f71f5ffd9901c61`.
- Exact-owned Native window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- PID/lsof-derived client: `localhost:8903/session 1`.
- Every stage reported the same client, session, and bundle URL.
- Unrelated DevTool clients were untouched.

## Real Interaction Evidence

All actions used real
`Input.emulateTouchFromMouseEvent` press/release input:

- Changes: `(744,108)`;
- first file expansion: `(739.5,159)`;
- Jump to file: `(844,68)`;
- explicit Close: `(620,252)`;
- backdrop: `(100,100)`.

Explicit Close:

- before open: first expanded, second collapsed;
- overlay unmounted after Close;
- after close: first remained expanded, second remained collapsed.

Backdrop:

- overlay reopened successfully after the explicit close;
- before open: first expanded, second collapsed;
- overlay unmounted after backdrop touch;
- after close: first remained expanded, second remained collapsed.

Both close paths therefore dismiss only the overlay. Neither click-through nor
state leakage changed the underlying diff expansion owner.

## Classification

- `native-diff-file-jump-explicit-close`: missing coverage
  `1.00 -> 0.00`.
- `native-diff-file-jump-backdrop-close`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

Physical Escape remains unclaimed. The current Lynxtron PC host does not
publish the required view-key event, so pointer dismiss evidence cannot be
used as a substitute for that platform boundary.

## Validation And Cleanup

- Exact-owned Native warning/error console was empty.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- No runtime source changed; this evidence-only loop reused the immediately
  preceding certified bundle and tests.
- All owned app, server, state, Git fixture, logs, console, and image artifacts
  were removed.
- Port `58090` was free.
- Entry and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Repository screenshot count remained exactly `100`.
