# Standalone Diff Native Wheel

## Classification

- Story: `standalone-diff-native-wheel`.
- Missing coverage: `1.00 -> 0.00`.
- P1 product/platform loss contribution: `1.00 -> 1.00`.
- Result: current Lynxtron host limitation, not an intentional platform delta
  and not a passing product cell.

The Changes dock has a valid overflowing vertical layout, but Native wheel
input does not move it. The limitation remains user-visible, so discovering
the host boundary does not reduce the loss score.

## Canonical Product State

- Temporary Git repository:
  `/tmp/synara-native-wheel-repo`.
- Canonical project: `native-wheel-project`.
- Canonical thread: `native-wheel-thread`.
- State was created through Synara RPC/product paths; SQLite was not written.
- Two tracked files had real working-tree changes.
- The first file replaced 30 lines; the second replaced one line.
- `git.readWorkingTreeDiff` returned `2537` patch bytes.
- The Changes trigger settled to the enabled accessible label
  `2 changed files`.

## Exact Native Ownership

- Window: exact-owned isolated `900x650` Lynxtron instance.
- Runtime: repository `@lynx-js/lynxtron@0.0.12-dev`.
- Bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`.
- DevTool client was derived from the owned process group and `lsof`, never
  guessed or selected by list order:
  `localhost:8903/session 1`.
- Unrelated `localhost:8901` and `localhost:8902` clients were untouched.

## Real Interaction Evidence

Real Native touch input opened Changes at `(744,108)` and expanded the first
file at `(739.5,159)`.

Measured geometry before wheel input:

- `DiffDockScroller`: `321x560 @ (579,90)`;
- second file header: `271x32 @ (604,1409)`;
- wheel hit at the scroller center resolved to the visible diff subtree.

Native `Input.emulateTouchFromMouseEvent(type="mouseWheel")` sent both
`deltaY=220` and `deltaY=-220`. The second file header remained at
`y=1409` after both:

- positive delta movement: `0`;
- negative delta movement: `0`.

A separate top-of-scroller control hit outside the nested horizontal code
lines also produced `0/0`. This rejects the hypothesis that only the inner
horizontal `SharedPrCodeLines` owner swallowed the vertical wheel.

## Scroll Extent Proof

A minimal direct-content diagnostic measured:

- viewport: `321x560`;
- `DiffDockScrollContent`: `297x1352 @ (591,102)`;
- second file header bottom: `1441`.

The content therefore exceeded the viewport by hundreds of pixels. The
negative wheel result is not caused by an empty diff, missing overflow, a
collapsed first file, or a viewport/content-size mismatch.

## Rejected Product Changes

Each candidate passed focused source tests and a Native/Desktop production
build, then failed the same exact-owned real-wheel check and was reverted:

1. adding `scroll-orientation="vertical"` beside `scroll-y`;
2. forwarding a code-line `bindwheel` event to outer `scrollBy`;
3. declaring vertical `consume-slide-event` angle ranges;
4. wrapping all content in one `flex-shrink: 0` direct child;
5. matching the previously successful HostInputProbe combination:
   `scroll-orientation="vertical"`, `scroll-y={true}`, and `bindscroll`.

The final direct-child/probe combination still measured `560/1352` viewport
and content heights while wheel movement remained `0/0`. No speculative
product patch was retained.

The historical HostInputProbe remains important control evidence: the same
host previously delivered three Native scroll events and reached
`scrollTop=242` in a simple fixed-height scroll view. The current gap is
therefore narrower than a globally missing Lynxtron wheel bridge, but it is
not app-fixable by the scroll-view activation, orientation, event, angle, or
direct-child contracts tested here.

## Harness Failures

Two expanded DOM-box diagnostic attempts reset the DevTool connection with
`ECONNRESET`. They are classified as harness failures and contributed no
product evidence. The lower-load single-node measurement succeeded and is the
only retained content-extent result.

Every failed patch application, failed focused test, failed real-wheel probe,
and DevTool reset was followed by `bun run browser:gate` before the next
browser-capable step. Every gate reported:

- `agent-browser session list --json`: `sessions: []`;
- agent-browser-owned daemon/browser process count: `0`.

All browser workflows remained under `browser:run`; process ownership remained
limited to `scripts/cleanup-agent-browser.sh`. No unrelated Chrome,
Playwright, remote-debugging, or Lynxtron process was terminated.

## Verification And Cleanup

- Focused tests passed before each retained conclusion:
  `3 files / 8 tests`.
- Native/Desktop production builds passed. Existing unsupported Lynx CSS and
  optional `bufferutil` / `utf-8-validate` warnings were unchanged.
- The final tracked worktree retained no product-code modification from the
  candidate fixes.
- Temporary server state, user data, Git fixture, logs, console artifact, and
  JPEG were removed by the owned lifecycle trap.
- Screenshot count remained exactly `100`.
- Exit `browser:gate` passed with `sessions: []` and zero
  agent-browser-owned processes.
