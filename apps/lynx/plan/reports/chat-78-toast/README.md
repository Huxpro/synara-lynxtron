# Native toast surface (#78)

Native now renders the existing imperative toast manager at app scope, so provider refresh, handoff, EventRouter and automation errors reach a visible surface. A failed composer send also queues a toast before its local instance can disappear. Callers retain their manager contract and canonical session state is untouched.

The host reuses upstream compact/expanded and thread-visibility predicates, the existing native button/icon primitives, and the native notification region’s card structure, extracted into `NotificationCard.lynx.tsx` and reused by voice notifications. The DOM/Base UI toast cannot compile on Native; the surface and host focus port therefore live in `apps/lynx`. Toasts show newest first with three visible cards, expand on hover, use the upstream 10s default, preserve loading/timeout-zero entries, and pause timers while the window is unfocused or the stack hovered. Thread-scoped entries stay queued for their rendered thread, including Sidechat; global errors survive navigation.

## Live evidence

Certified run `2026-10-11T05-51-15-195Z-38362`, dark / 1440×900 / 13px, probe-free production bundle. `chat-toast-check.mjs` temporarily writes an invalid keybindings configuration **only inside the owned isolated home**. The normal server watcher delivers the same warning through each EventRouter; no toast/state injection or SQLite mutation is used. It restores the file and verifies both real Dismiss controls. The script fails when any measured box dimension or position exceeds 2px.

| Surface/control | Native − Electron height |   Width | Position |
| --------------- | -----------------------: | ------: | -------- |
| Toast card      |                     +2px |     0px | 0px      |
| Title           |                   +0.5px |     0px | 0px      |
| Description     |                   +1.5px |     0px | y +0.5px |
| Dismiss         |                      0px |     0px | 0px      |
| Action          |                      0px | +0.15px | y +2px   |

All five probes meet 2px; no platform exemption is claimed. [Electron screenshot](toast-electron.png), [Native screenshot](toast-native.png), [raw measurements](toast.json).

The live trigger exercises the EventRouter delivery path. Other error callers share this same manager; their individual provider/automation failures were not each induced live. Component tests cover queued errors across navigation, updates, actions, dismiss, thread filtering, loading and focus-paused timing. DevTool input is not physical AppKit input acceptance.

## Verification

- Lynx: 422 files / 1789 tests / zero failures; focused toast/voice/manager/send tests 13/13.
- Shared toast logic and route visibility: Vitest 15/15.
- Root formatting passes; lint has zero errors (1302 warnings), typecheck passes 8/8 packages.
- thread cell passes: 41/45 labelled controls within 2px; four previously named trail hit-area exemptions.
- Canonical message formats measured, **not passed**: 5/8 rows and 14/23 paired controls within 2px. Remaining row heights +2.1, −8.7, −5px; raw differences in `canonical-message-formats.json`.
- J1 excluding only Stop, J2 and J7 pass on both renderers. J7 uses real signed-in Codex and Claude turns.
- Owned launcher exited; `Cleanup verified` reports no remaining Lynxtron, Electron or Web processes. Build hashes and cleanup are in `build-identity.json`.

This pass does not certify expanded #85 fixture coverage, all eight theme/size/font configurations, full matrices, or three final consecutive workflow repetitions. #85 and #77 were reverted with blockers in their issues; #35 remains recorded and unfixed.
