# Standalone Diff Native Wheel

## Classification

- Story: `standalone-diff-native-wheel`.
- Original classification: P1 product/platform loss.
- Corrected classification: harness loss / missing physical-input coverage.
- Result: the retained automated input did not prove that a real hardware
  wheel reached the exact-owned Native process. It cannot support a product or
  platform loss claim.

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

The original run used DevTool
`Input.emulateTouchFromMouseEvent(type="mouseWheel")` with both
`deltaY=220` and `deltaY=-220`. The second file header remained at
`y=1409` after both:

- positive delta movement: `0`;
- negative delta movement: `0`.

A later audit correctly classified the DevTool path as a harness limitation
tracked upstream as `lynx-family/lynxtron#151`.

The subsequent macOS `CGEvent` path was still synthetic input. It used a
global event tap and did not include a passing exact-owned simple-scroll
control in the same ownership conditions. The zero Diff movement was therefore
not sufficient to prove a product or platform loss.

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

The stricter follow-up reran HostInputProbe with:

- an exact-owned foreground Lynxtron process;
- frontmost PID equal to the owned PID;
- cursor position exactly equal to the target scroll-view coordinates;
- both positive and negative synthetic pixel-wheel deltas;
- `CGEvent.postToPid` and global HID event posting.

The simple fixed-height HostInputProbe scroll-view produced zero `bindscroll`
calls under those conditions. The automated CGEvent path therefore cannot
certify Native wheel delivery in this environment.

The prior upstream issue was corrected and closed:

- https://github.com/lynx-family/lynx/issues/8665

Separate DevTool emulation blocker:

- https://github.com/lynx-family/lynxtron/issues/151

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

## Corrected Verification And Cleanup

- Current Clay `develop` was built in an isolated clone. A wrapper-shaped
  horizontal-inside-vertical scroll test passed through the real hit-test
  path without an engine change, rejecting the proposed ancestor-wrapper
  engine patch.
- Synara focused HostInputProbe, Diff dock, word-wrap, and fidelity tests
  passed.
- Native/Desktop production builds passed with unchanged registered warnings.
- No product or Lynx engine patch was retained.
- Temporary server state, user data, Git fixture, logs, console artifact, and
  JPEG were removed by the owned lifecycle trap.
- Screenshot count remained exactly `100`.
- Exit `browser:gate` passed with `sessions: []` and zero
  agent-browser-owned processes.
