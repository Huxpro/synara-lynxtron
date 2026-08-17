# Native Diff File Jump And TextEncoder `encodeInto`

## Newly Discovered Scope

An exact-owned Native cell exercised a product path that was previously
certified only through Lynx-for-Web:

`Changes -> expand a long first patch -> Jump to file -> select the second file`

The canonical snapshot contained two real working-tree changes:

- `first.txt`: 30 replaced lines;
- `second.txt`: one replaced line;
- `git.readWorkingTreeDiff`: `2537` patch bytes.

State was created through Synara RPC/product commands. SQLite was read-only and
was not used to create fixtures.

## Harness Identity

- Current source HEAD before the slice: `7edf76421`.
- Exact-owned isolated Native window: `900x650`.
- Native content image: `1800x1300`, DPR 2.
- Final staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- Bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`.
- DevTool client was derived from the owned process group and `lsof`:
  `localhost:8903/session 1`.
- Every interaction stage re-proved the same client, session, and bundle URL.
- Unrelated `localhost:8901` and `localhost:8902` clients were untouched.

An early attempt correctly invalidated its own evidence because the staged
bundle still contained a reverted speculative wheel candidate rather than the
clean current source. The Native/Desktop build was rerun before any retained
comparison. That mismatch is harness loss, not product loss.

## Native Interaction Evidence

All retained actions used real
`Input.emulateTouchFromMouseEvent` press/release input:

- Changes trigger: `(744,108)`;
- first file header: `(739.5,159)`;
- Jump to file trigger: `(844,68)`;
- second file row: `(450,378)`.

The first file expansion pushed the second header to:

`271x32 @ (604,1409)`

After selecting the second file:

- picker closed;
- first file changed from expanded to collapsed;
- second file changed from collapsed to expanded;
- second header moved to `271x32 @ (604,189)`;
- scroller was `321x560 @ (579,90)`;
- target was fully visible.

This direct navigation remains usable even though the separate Native wheel
story is still an open host limitation.

`native-standalone-diff-file-jump-pointer`: missing coverage
`1.00 -> 0.00`; product contribution `0.00 -> 0.00`.

Native keyboard confirmation remains unclaimed. Lynxtron DevTool exposes the
auditable mouse/touch input method but not an equivalent physical keyboard CDP
method, and the known PC view-key publication boundary must not be bypassed
with programmatic input mutation.

## P1 Product Loss

The first otherwise-successful Native interaction produced:

`TypeError: PR.encodeInto is not a function`

The shared diff parser creates `new TextEncoder()` and calls the standard
`encodeInto()` method while normalizing patch lines. PrimJS exposed a partial
`TextEncoder` constructor with `encode()` but no `encodeInto()`. The existing
Synara polyfill installed only when `TextEncoder` was entirely absent, so it
left the partial constructor active.

`native-text-encoder-encode-into-missing`: P1 product contribution
`1.00 -> 0.00`.

## Root Fix

`apps/lynx/src/text-encoding-polyfill.ts` now:

- implements bounded UTF-8 `encodeInto`;
- returns standard UTF-16 `read` and byte `written` counts;
- never writes a partial UTF-8 symbol;
- replaces isolated UTF-16 surrogates with U+FFFD;
- replaces an existing partial `TextEncoder`, not only an undefined one;
- preserves an already complete platform constructor.

The final staged bundle installs this constructor before the diff parser
creates its encoder.

## Verification

- Lynx focused tests: `3 files / 11 tests`.
- Shared diff parser tests: `1 file / 16 tests`.
- New coverage includes bounded ASCII/astral writes, standard counts,
  replacement-character behavior, constructor method exposure, and replacement
  of a partial existing `TextEncoder`, and preservation of complete platform
  constructors.
- Native/Desktop production build passed.
- Existing unsupported Lynx CSS and optional
  `bufferutil` / `utf-8-validate` warnings were unchanged.
- Final exact-owned Native file-jump behavior passed with an empty
  error/warning console.
- Temporary JPEG was exactly `1800x1300` and was deleted.

## Harness Failures And Cleanup

Inspecting the mounted file-jump overlay through `DOM.performSearch` repeatedly
reset the DevTool socket with `ECONNRESET`, while the owned app remained alive
and continued product RPCs. Retained interaction therefore used five short
connections against the same client/session. Dynamic state commits occurred
between connections; final stable DOM geometry, expansion state, overlay
closure, and console were still independently verified.

The row touch used the fixed centered-dialog geometry at the exact certified
window size. It was not accepted by coordinate alone: the final state had to
prove the picker closed, only the target expanded, and its header became fully
visible.

Every stale-bundle rejection, malformed preflight, DevTool reset, and failed
console parser was followed by `bun run browser:gate` before the next
browser-capable action. Every gate reported:

- `agent-browser session list --json`: `sessions: []`;
- agent-browser-owned daemon/browser process count: `0`.

All owned server, app, repository, state, log, console, and image artifacts
were removed. Port `58090` was free and repository screenshot count remained
exactly `100`.
