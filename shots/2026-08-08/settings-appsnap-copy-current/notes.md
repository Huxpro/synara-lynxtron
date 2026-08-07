# Settings AppSnap shared copy

Status: retained Lynx-for-Web evidence for the AppSnap shared product copy.

## Residual

The Lynx capability panel correctly explains that screen capture, permission,
and global-shortcut bridges are unavailable. However, two shared product
descriptions had been shortened:

- the hero omitted the privacy sentence that the capture stays on-device until
  the message is sent;
- Destination omitted the one-minute target window and consecutive-snap
  grouping.

Those sentences describe product behavior and privacy rather than claiming the
Lynx host currently supports capture.

## Fix

The Lynx panel now uses the full Web-authoritative copy while retaining its
explicit runtime-unavailable explanation and disabled controls.

## Evidence

Same isolated service, dark theme, comfortable density, and `1280x820` DPR 1:

- hero description contains:
  `the capture stays on this device until you send the message`;
- Destination contains:
  `in the last minute` and `consecutive snaps stay together`;
- connection diagnostics are empty;
- retained screenshot: `lynx-web.png` (`1280x820`).

The Lynx hero is taller than Web because it includes an additional truthful
capability-boundary paragraph. That difference is intentional and is not
hidden with a local offset.

## Verification

- Focused AppSnap Rstest: 1 file, 2 tests passed.
- Lynx-for-Web production build passed.
- Native/Desktop production build and Sharp runtime staging passed.
- Uncached changed-lines React Doctor against `13ec016b` reported zero
  diagnostics.
