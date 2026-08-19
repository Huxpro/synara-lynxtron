# User Preview Follow-ups

These issues came from hands-on review of the current workspace Lynxtron app.
Each item remains open until it has focused tests, a production build, and
exact-owned Native evidence.

## P1 — Sidebar ownership and scrolling

- Compare the original Web sidebar and current Lynx sidebar ownership.
- Keep the Studio/Projects segmented identity attached to its control.
- Decide and implement one intentional fixed/scroll structure.
- Preferred contract to verify:
  - Studio/Projects plus New thread, Search, Kanban, Pull requests, and
    Automations remain fixed;
  - only project/chat collections consume the vertical scroll viewport.
- Verify normal and constrained heights with real wheel input and fixed-header
  geometry.

## P1 — Sidebar resize

- Compare the current sash implementation with `~/github/lynxtron-examples`.
- Make the visible handle publish real Native pointer movement.
- Verify width changes, min/max constraints, persistence, restart restoration,
  and no main-content displacement loop.

## P1 — Sidebar icon rendering

- Audit missing/wrong sidebar SVGs against the Web authority.
- Compare the installed Lynxtron runtime with current upstream SVG fixes.
- Upgrade only if the upstream change is compatible and verified.
- If the runtime still cannot render the required SVG subset, prepare a
  minimal upstream issue with a standalone reproduction and use a product-safe
  fallback meanwhile.

## P0 — `r.trim is not a function`

- Capture the exact Native stack/source path.
- Compare current Rspeedy/PrimJS compatibility configuration with Lynx official
  runtime/polyfill guidance.
- Fix the missing or partial runtime API at the entry/config boundary rather
  than swallowing the exception.
- Add a focused regression for the exact non-string/partial-polyfill case and
  require a clean exact-client console.

## P1 — Permission menu fidelity

- Compare the permission popup with the original Web control.
- Correct typography, row height, selected material, popup dimensions,
  checkmark alignment, trigger treatment, and light/dark behavior.
- Verify Full access and Default permissions interaction at the Native minimum
  window and a larger desktop size.

## P0 — Cmd+R fresh runtime reload

- Current failure: after `CmdOrCtrl+R`, Native can report
  `snapshotPatchApply failed: ctx not found, snapshot type: 'null'`.
- The current `reloadLynxWindow()` path calls `loadFile()` / `loadURL()` again
  on the existing `LynxWindow`; do not treat that as fresh until exact-owned
  evidence proves the old renderer and snapshot context were destroyed.
- Make `CmdOrCtrl+R` either fully reload the Lynx bundle with a new renderer
  context or fully close and reopen the application window/process while
  preserving the canonical route and server connection.
- Keep force reload separate only if it has a meaningfully stronger lifecycle
  boundary.
- Verify repeated reloads from populated thread, empty thread, Settings, and
  error/LogBox states. Each reload must produce one healthy renderer, no stale
  DevTool session, no duplicate host listeners, and a clean exact-client
  warning/error console.
