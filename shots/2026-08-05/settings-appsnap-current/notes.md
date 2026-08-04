# Settings AppSnap current-head evidence

Status: retained Web, Lynx-for-Web, and exact-owned Native unavailable evidence

## Identity

- Source base: `fecffd47`
- Lynx-for-Web bundle SHA-256:
  `9df0fcbf792a03d6d22da33150d854fbc0c09738db4809232b637ab07a53ebc1`
- Native bundle SHA-256:
  `94dd2b181055e888401908b76f6ec80779c66409e1f1a4e8b5095576cc761cd6`
- SQLite snapshot SHA-256:
  `c5313f03838f0669fc1e8cb558bf7d2d04c86b479bebc3a1559472c740db95a5`
- Route: Settings AppSnap
- Theme: light
- Density: comfortable
- State: unavailable
- Browser viewport: `1280x820`, DPR 1
- Native outer window: `1280x820`
- Native LynxView frame: `2560x1576`, DPR 2

## Capability audit

The Web desktop implementation requires an `appSnap` bridge with:

- global shortcut registration and conflict checking;
- macOS Input Monitoring permission state;
- macOS Screen Recording permission state;
- frontmost-window capture;
- capture events and destination routing.

The Lynxtron host exposes none of those capabilities. Repository and packaged
runtime searches found only menu accelerators, not a screen-capture or
AppSnap service. Presenting a working toggle or shortcut picker would therefore
be fabricated functionality.

## Delivered parity

The Lynx page retains Web's AppSnap hero and Capture anatomy while honestly
rendering:

- disabled Enable AppSnap semantics with no event handler;
- unavailable shortcut registration;
- the real Automatic destination explanation;
- unavailable capture sound;
- explicit host-boundary copy naming screen capture, permissions, and global
  shortcut delivery.

No `enableAppSnap` preference is read or written in the unsupported runtime.

## Geometry

Web / Lynx-for-Web / Native:

- content rail: `x=432, y=0, width=672`;
- header: `x=456, y=32, width=624, height=54`;
- hero: `x=456, y=118, 624x130` in all three clients;
- Enable row: Web `x=457, y=305, 622x83.5`; Lynx
  `x=457, y=305, 622x84`; Native `x=457, y=304, 622x84`;
- Shortcut row: Web `97px`; Lynx `97px`;
- Destination row: Web/Lynx `79px`;
- Capture sound row: Web/Lynx `60px`;
- disabled Native switch: `32x18`.

The first implementation used one generic 79px row, which caused visible
cumulative drift. Measurements assigned the differences to four AppSnap-owned
semantic rows; named row heights close them without changing global Settings
primitives.

## Verification and cleanup

- Focused tests prove the route, capability copy, no interaction handlers,
  disabled accessibility state, and calibrated anatomy.
- Native capture used PID `4872`, PID-derived `localhost:8903/session 1`,
  seven required roles, and zero warning/error console messages.
- The Native light-theme capture changed only the owned KV file; after process
  shutdown the original bytes were restored with SHA-256
  `f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.
