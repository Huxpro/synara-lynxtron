# Native AppSnap Fidelity

## New Scope

- Settings → AppSnap, light theme, `1250×896`;
- Native helper staging and permission state;
- default both-Option global chord;
- frontmost external window capture;
- host capture → picked-file capability → composer image chip;
- restart recovery, same-capture deduplication, and explicit removal cleanup;
- Lynx-for-Web unsupported capability correlation.

## Product Loss

The Lynx AppSnap page reproduced the original settings anatomy but permanently
disabled every control and stated that AppSnap required the desktop app. The
current runtime is itself the Lynxtron macOS desktop app.

The original Swift AppSnap helper and shared `DesktopAppSnapManager` were
already platform-neutral Node/main-process code. A read-only preflight proved:

- the helper built and executed successfully;
- Input Monitoring permission: `granted`;
- Screen Recording permission: `granted`;
- the default both-Option shortcut does not require Electron
  `globalShortcut`.

The permanent unavailable state was therefore a P1 product capability loss,
not an upstream screen-capture blocker.

## Fix

- Reused the shared `DesktopAppSnapManager` in the Lynxtron main process.
- Staged the signed Swift helper in every Native/Desktop production build.
- Added AppSnap state, enable, permission, pending-capture, and acknowledge
  bridge methods.
- Kept Lynx-for-Web explicitly unsupported instead of emulating macOS APIs.
- Registered captured PNGs through the existing picked-file capability and
  preview/upload pipeline; no multi-megabyte base64 payload crosses the event
  bridge.
- Added a root AppSnap coordinator that attaches captures to the active thread
  and retains captures while no thread is open.
- Enabled the default both-Option listener and persisted its setting.
- Added real permission state and recheck controls.
- Kept custom global key chords explicitly unavailable because Lynxtron does
  not expose `globalShortcut`; the stored chord is preserved, not discarded.
- Added a persisted capture-sound switch and a real Preview action.
- Reused the AppSnap Swift helper for a quiet native double-click cue, avoiding
  renderer timing and duplicate playback.
- Corrected destination copy to the implemented active-thread/pending behavior.

## Durability

The first implementation acknowledged a capture as soon as its image chip was
added. That could delete the manager's recovery pair before the user sent the
message.

The final contract:

- keeps the manager's pending PNG/metadata pair after composer attachment;
- stores `appSnapCaptureId` with the image chip;
- acknowledges only after successful message dispatch or explicit user
  removal;
- uploads do not destroy the picked capability before dispatch succeeds, so a
  failed provider dispatch can retry without recapturing;
- reuses one picked token per capture within a process;
- replaces a stale picked capability after restart rather than duplicating the
  chip;
- removes expired and startup-orphan picked PNGs;
- keeps the capture pending when preview or attachment limits reject it.

## Real Native Behavior

Exact-owned Native successfully completed the real product flow:

1. AppSnap Settings reported `Input Monitoring: granted` and
   `Screen Recording: granted`.
2. Enabling AppSnap changed the switch to On and status to
   `Listening — press both Option keys to snap`.
3. A synthetic left/right `flagsChanged` sequence was accepted by the actual
   passive global event tap.
4. Capturing Synara itself was correctly rejected with
   `excluded_frontmost_application`.
5. Finder was then made frontmost and the same both-Option chord triggered a
   real ScreenCaptureKit capture.
6. The host registered a `379178` byte PNG and the active thread rendered one
   image chip.
7. The capture remained pending on disk; no premature
   `appSnapAcknowledgeCapture` occurred.
8. After Native restart, the picked token changed from
   `69304886-...` to `77bedebc-...`, while the composer still contained exactly
   one chip with capture id `36ce92d3-c474-4d66-bf32-783ee0653276`.
9. Activating the visible Remove action emitted both
   `attachmentsReleasePickedFile` and `appSnapAcknowledgeCapture`.
10. The chip and all AppSnap pending/picked files were gone.

No direct SQLite mutation was used. SQLite was read only to confirm there were
no remaining temporary fidelity threads.

## Capture Sound

The original capture cue is now implemented by the same native helper that
owns the global listener and ScreenCaptureKit capture:

- Preview launches the staged helper with `--preview-sound`;
- a successful real capture plays the cue only when the watch helper was
  started with `--play-sound`;
- the cue is a quiet `Tink` followed by `Pop`, separated by `70ms`;
- the preference uses the shared `appSnapPlaySound` app setting and survives
  renderer restarts;
- changing the preference while AppSnap is listening restarts only the owned
  watch helper, so the active helper arguments always match the visible switch.

Exact-owned Native outcome:

1. Startup synchronized `appSnapPlaySound: true` through
   `bridge.appSnapSetPlaySound`.
2. Activating the visible Preview button emitted
   `bridge.appSnapPreviewSound`, played the native cue, and rendered
   `Preview played.`.
3. Switching Off rendered `aria-checked=false`, emitted
   `appSnapSetPlaySound { enabled: false }`, and persisted
   `"appSnapPlaySound":false`.
4. Switching On rendered `aria-checked=true`, emitted
   `appSnapSetPlaySound { enabled: true }`, and persisted
   `"appSnapPlaySound":true`.
5. The exact-owned helper child then ran with
   `--watch ... --play-sound`.

## Layout Loss

The first exact Native Settings screenshot exposed a separate P1 readability
loss: the Shortcut, Destination, and Capture sound rows were allocated only
`22`, `18`, and overlapping logical pixels. This was a real Native layout
failure, not capture mismatch.

The final rows use a `40px` minimum copy region. Measured heights are:

- Enable: `61px`;
- Shortcut: `62px`;
- Destination: `58px`;
- Input Monitoring: `36px`;
- Screen Recording: `36px`.

The final screenshot has no overlap.

## Lynx-for-Web Correlation

- URL:
  `http://localhost:8891/lynx/index.html?route=%2Fsettings%2Fappsnap`;
- viewport: `1250×896`, DPR `1`;
- switch: `32×20 @ (1020,325)`, `aria-disabled=true`;
- page errors: none;
- console: only the known upstream initialization deprecation.

This is an intentional platform delta: Lynx-for-Web does not impersonate
macOS Input Monitoring, Screen Recording, or global event taps.

## Verification

- Web AppSnap storage projection: `7/7`;
- shared desktop AppSnap manager: `20/20`;
- Lynx AppSnap Settings/coordinator focused suite: `4/4`;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- staged Native bundle SHA-256:
  `a3b005cb420487bbefc586d055e48622ee794408ae5464be7c33691ccd6df4f5`;
- staged desktop main SHA-256:
  `a20fd3cc6f1bd223a5bfc9c954ff99b89f6e1d924b48349445c2b2a8f214e8fb`;
- staged helper SHA-256:
  `f0dbd2a79b341f9e5a43c903049a66625809dabb502763ed464936cf9e103927`;
- exact-owned final PID: `58743`;
- PID-derived DevTool client: `localhost:8902`, session `1`;
- exact-client error/warning console: empty;
- final screenshot:
  `native/settings-ready-light-1250x896@2x.png`;
- screenshot SHA-256:
  `8da3b665ebc3a4aae004eb7273865b3727f53d69c3f496e408738273b9156550`;
- local screenshot count remained `100`.

One historical pull-request interaction PNG was removed because it was
byte-identical to another retained frame in the same sequence. No failed sample
was filtered and no fidelity weight or scope was changed.

## Residuals

- custom modifier+key global chords: missing Native capability, P2;
- automatically creating a fresh task when no thread is active: missing
  product coverage, P2;
- original app-icon/source metadata is not yet displayed on the Lynx chip:
  accepted content residual, P3.
