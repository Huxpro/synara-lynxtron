# Native Diff File Jump Roundtrip

## Newly Discovered Scope

This exact-owned Native cell extends the previously one-way file-jump proof
into an active-state roundtrip:

`first expanded -> jump to second -> second active -> reopen picker -> jump to first`

The canonical product state reused the real two-file working-tree diff:

- `first.txt`: 30 replaced lines;
- `second.txt`: one replaced line;
- patch bytes: `2537`.

State was created through Synara RPC/product paths. SQLite was not written.

## Harness Identity

- Source commit: `343273eb161b602c9a824dbd193ffbb6368821ea`.
- Exact-owned Native window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- PID/lsof-derived client: `localhost:8903/session 1`.
- Every one of the eight interaction/verification stages independently
  reported the same client, session, and staged bundle URL.
- Unrelated `localhost:8901` and `localhost:8902` clients were untouched.

## Real Interaction Evidence

All actions used real
`Input.emulateTouchFromMouseEvent` press/release input:

1. open Changes at `(744,108)`;
2. expand first file at `(739.5,159)`;
3. open Jump to file at `(844,68)`;
4. choose second row at `(450,378)`;
5. reopen Jump to file at `(844,68)`;
6. choose first row at `(450,346)`.

First jump:

- second header began offscreen at `271x32 @ (604,1409)`;
- first changed from expanded to collapsed;
- second changed from collapsed to expanded;
- second header became visible at `271x32 @ (604,189)`.

Return jump:

- first header before reopening was visible at `271x32 @ (604,143)`;
- first changed from collapsed to expanded;
- second changed from expanded to collapsed;
- first remained fully visible at `271x32 @ (604,143)`;
- scroller remained `321x560 @ (579,90)`.

The active file therefore remained unique in both directions. Reopening the
picker from a scrolled/selected state did not leak the previous selection,
expand both files, or lose target visibility.

## Classification

- `native-standalone-diff-file-jump-active-roundtrip`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

Native keyboard confirmation remains separately unclaimed because the current
DevTool input domain does not expose an auditable physical-keyboard method.
This pointer roundtrip does not substitute for that platform boundary.

## Validation And Cleanup

- The exact-owned Native warning/error console was empty.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- The complete Native/Desktop build and focused runtime tests belong to the
  immediately preceding `343273eb1` product slice; no runtime source changed
  during this evidence-only roundtrip, so they were not rerun.
- All owned app, server, state, Git fixture, logs, console, and image artifacts
  were removed.
- Port `58090` was free.
- Entry and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Repository screenshot count remained exactly `100`.
