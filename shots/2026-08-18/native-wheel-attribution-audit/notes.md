# Native Wheel Attribution Audit

## Result

The active `native-diff-nested-wheel-routing` P1 was based on insufficient
input-ownership evidence. It is corrected to a harness loss, not closed as a
product fix.

No Synara UI code, Lynx engine code, score weight, visual sample filter, or
scope definition changed.

## Strict Control

The audit used the repository's standalone HostInputProbe:

- exact-owned Lynxtron process and PID-derived DevTool client;
- foreground app with `frontmost PID == owned PID`;
- DevTool-measured `HostInputProbeScroll` geometry;
- cursor position verified equal to the target screen point;
- positive and negative pixel-wheel deltas;
- both global HID `CGEvent` and `CGEvent.postToPid`;
- `bindscroll` handler reporting through the Native host bridge.

The simple `852x120` scroll-view produced zero `bindscroll` calls. This rejects
the assumption that the same automated CGEvent path proves a Diff-specific
failure.

## Engine Negative Control

Current Lynx `develop` was checked in an isolated worktree and disposable
dependency-synced clone. A proposed Clay ancestor-wrapper change was tested
with a wrapper-shaped horizontal-inside-vertical wheel case.

The behavior test passed on the unmodified engine through the real hit-test
path, so the proposed patch was rejected and the worktree was removed. No
Lynx PR was created.

The previous upstream issue now contains the correction and is closed:

- https://github.com/lynx-family/lynx/issues/8665

The separate DevTool input-emulation issue remains valid:

- https://github.com/lynx-family/lynxtron/issues/151

## Verification

- Synara focused Rstest: `3 files / 10 tests`.
- Fidelity-loss logic: `11/11`.
- Clay focused suite: `NestedScrollableTest.*`, `31/31`.
- Clay wrapper-shaped behavior control passed on the unmodified engine.
- Synara Native/Desktop production builds passed with existing registered
  warnings.
- All failed probes and interrupted loops were followed by `browser:gate`.
- Final browser ownership: `sessions: []`, zero agent-browser processes.
- No screenshots added; repository screenshot count remained `100`.
