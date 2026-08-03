# Settings Notifications — Web / Lynx / Native extension

## Scope

- New covered UI: Settings → Notifications
- Canonical shared composition: `SettingsNotificationsPanel`
- Controls:
  - Activity toasts
  - Desktop notifications
- Browser representative cells:
  - light `1280×820`
  - dark `1440×900`
- Native representative cell:
  - light outer `1280×820`, DevTool `2560×1576`

This slice does not enter terminal, embedded browser, PDF, voice, P8-Q3,
P8-Q4, or P9-R1.

## Ownership and capability boundary

- Web and Lynx consume the same physical composition for section/row order,
  copy, reset visibility, current/default state, and switch anatomy.
- Web keeps its existing browser/desktop permission and `Test` notification
  behavior as a platform leaf.
- Lynx does not render a fake `Test` button. The Desktop notification row
  explicitly says:
  `System notification tests are unavailable in this runtime.`
- The first retained Lynx diagnostic revealed that shared `SettingsRow` status
  content was dropped by the native Elements adapter. The adapter now maps
  11px status content to a dedicated native text role. Frames before that fix
  were discarded.

## Persistence

- Both preferences use canonical `synara:app-settings:v1` storage and preserve
  unrelated fields.
- Lynx-for-Web:
  - toggled Activity toasts Off;
  - complete page reload plus rendered navigation retained Off;
  - restored On.
- Native:
  - toggled Activity toasts Off;
  - isolated `kv.json` stored both notification booleans;
  - exact-owned app restarted;
  - exact DOM restored `aria-checked="false"` and accessibility value `Off`;
  - the setting was restored On before cleanup.

## Geometry

Both Browser cells preserve the established Settings shell offset:

| Anchor | Lynx-for-Web delta |
|---|---:|
| Page title | `x +5px / y +8px` |
| Section/card | `x +5px / y +5.25px` |
| Activity toast row | `x +5px / y +5.25px` |
| Desktop notification row | `x +5px / y +5.25px` |

The Desktop notification row is intentionally 15px shorter in Lynx because
Web owns a browser permission status plus the `Test` button while Lynx owns one
explicit unavailable-capability status. This is a registered platform leaf,
not hidden missing functionality.

## Gates

- Web focused tests: 1 file / 2 tests.
- Lynx focused tests: 2 files / 13 tests.
- Web production build: 8,937 modules.
- Lynx-for-Web and Desktop production builds passed.
- Strict reuse audit: Settings `52.73%`.
- Strict style audit: `98.07%`.
- Browser PNG dimensions and viewport/DPR were exact.
- Browser page-error files are empty.
- Native exact-owned PIDs `99902` and restart PID `6627` used PID-derived
  `localhost:8903`, session `1`, and the staged production bundle.
- Native exact-client error/warning console is empty.
- Shared snapshot hash remained
  `7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`.
