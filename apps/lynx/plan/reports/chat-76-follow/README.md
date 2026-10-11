# #76: follow and detached-reader verification

The run started from `huxcc/r2-g-follow-stream` (`26b57c942`). All product changes are in `apps/lynx`; upstream source is unchanged. Existing follow and scroll helpers were extended.

## Change

A provider pause no longer starts the animated settle pass while a turn is active. Native animated programmatic scrolling reports the same source as gestures (see the P0-S4 runtime experiment); starting that animation while content is growing can release follow. A new active turn also cancels the previous pending settle. Turn completion still runs the settled-layout correction.

The lower-threshold handler now uses the existing user-scroll source and geometry gate. A layout/threshold event alone cannot reattach a detached reader. Upward user scrolling still releases follow.

The earlier run `2026-10-10T23-40-46-727Z-63661` failed Native follow on its third J2 repetition after two paired passes. The exact failed-event sequence was not captured; the two fixes remove confirmed boundary risks, rather than establishing the precise cause of that historical failure. Temporary probes were removed before acceptance.

## Current evidence

Certified run `2026-10-11T03-58-41-293Z-26915`: dark, 1440×900, default 13px chat font, one isolated backend, both apps in the background. Build identity and results are beside this file.

| Check                                  | Result                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `bun run fmt:check`                    | Pass                                                                                     |
| `bun run lint`                         | Pass, 1297 warnings, zero errors                                                         |
| `bun run typecheck`                    | 8/8 packages pass                                                                        |
| Lynx unit suite                        | 421 files, 1786 tests, zero failures                                                     |
| Focused follow/scroll tests            | 36/36 pass                                                                               |
| Stop exclusion adapter tests           | 2/2 pass                                                                                 |
| thread cell                            | Pass: 41/45 controls ≤2px; four existing trail hit-area exemptions                       |
| settings-appearance                    | Pass; prior connection failure not reproduced                                            |
| J1                                     | Both pass; only Stop excluded, send-again and reload still run                           |
| J2                                     | Five consecutive paired passes on the final bundle                                       |
| J7                                     | Both pass with real Codex and Claude provider turns                                      |
| Canonical real-turn transcript formats | Measured, not passed: four of eight row heights and 12 of 23 paired controls outside 2px |

J1 is the existing workflow with one guarded verification adaptation in `apps/lynx/scripts/chat-workflow-without-stop.mjs`: the combined Stop/resend step becomes a normal send-again step. It preserves all later checks and fails if the source anchors change. #35 is excluded, not fixed.

## Remaining scope

The canonical format measurement uses the existing real-provider fixture and writes no SQLite data. Full synthetic row coverage, eight theme/size/font combinations, and expanded work/diff shapes remain #85. Current assistant row height deltas are +2.4, +2.1, −8.7, and −5px; controls and missing labels are in `canonical-message-formats.json`. These are not declared platform exemptions.

This pass does not certify the complete 24/24 and 28/28 matrices, three final consecutive J1/J2/J7 repetitions, or physical AppKit input. DevTool drag selection is a product-logic check, not physical-input acceptance. #74 and #75 were squash-merged after green CI as `b01531dc0` and `a2b9870c5`. The #76 PR is based on that merged tree.
