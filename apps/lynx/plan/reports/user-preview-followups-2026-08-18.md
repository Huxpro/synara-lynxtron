# User Preview Follow-ups

These issues came from hands-on review of the current workspace Lynxtron app.
Each item remains open until it has focused tests, a production build, and
exact-owned Native evidence.

## Completed — Sidebar ownership and scrolling

- Compare the original Web sidebar and current Lynx sidebar ownership.
- Keep the Studio/Projects segmented identity attached to its control.
- Decide and implement one intentional fixed/scroll structure.
- Preferred contract to verify:
  - Studio/Projects plus New thread, Search, Kanban, Pull requests, and
    Automations remain fixed;
  - only project/chat collections consume the vertical scroll viewport.
- Verify normal and constrained heights with real wheel input and fixed-header
  geometry.
- Closed with exact Native ownership evidence in
  `shots/2026-08-18/native-sidebar-fixed-navigation-scroll-ownership/`.

## Completed — Sidebar resize

- Compare the current sash implementation with `~/github/lynxtron-examples`.
- Make the visible handle publish real Native pointer movement.
- Verify width changes, min/max constraints, persistence, restart restoration,
  and no main-content displacement loop.
- Closed with real system-mouse drag and cold-restart restoration in
  `shots/2026-08-18/native-sidebar-resize-connection-audit/`.

## Completed — Sidebar icon rendering

- Audit missing/wrong sidebar SVGs against the Web authority.
- Compare the installed Lynxtron runtime with current upstream SVG fixes.
- Upgrade only if the upstream change is compatible and verified.
- If the runtime still cannot render the required SVG subset, prepare a
  minimal upstream issue with a standalone reproduction and use a product-safe
  fallback meanwhile.
- Closed by replacing the unsupported Web mask path with exact Native SVG
  adapters in `shots/2026-08-18/native-sidebar-resize-and-primary-icons/`.

## Completed — Non-string `trim` / `toLowerCase` runtime failures

- Capture the exact Native stack/source path for both observed forms:
  `r.trim is not a function` and
  `Cannot read properties of undefined (reading 'toLowerCase')`.
- Compare current Rspeedy/PrimJS compatibility configuration with Lynx official
  runtime/polyfill guidance.
- Do not label an undefined receiver as a missing String polyfill. Validate
  cross-boundary payloads and renderer lifecycle state, then fix the owning
  source or the actual missing runtime API at the entry/config boundary.
- Add a focused regression for the exact non-string/partial-polyfill case and
  require a clean exact-client console.
- Native runtime inspection proved both methods exist on background and main
  threads. A later cold-start reproduction isolated the remaining
  `toLowerCase` rejection to the fetched model catalog crossing the initial
  landing bootstrap/IFR render boundary. The landing bootstrap no longer
  fetches or carries that catalog; the existing post-mount Composer query owns
  model discovery instead. Exact-owned production verification covered cold
  start, real model-menu discovery, canonical send/navigation, provider
  response, and a clean exact-client console.

## Completed — Permission menu fidelity

- Compare the permission popup with the original Web control.
- Correct typography, row height, selected material, popup dimensions,
  checkmark alignment, trigger treatment, and light/dark behavior.
- Verify Full access and Default permissions interaction at the Native minimum
  window and a larger desktop size.
- Closed with exact icon, row, popup, and real selection evidence in
  `shots/2026-08-18/native-composer-permission-popup-fidelity/`.

## Completed — Cmd+R fresh runtime reload

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
- `CmdOrCtrl+R` now performs an idempotent full app relaunch, preserves only
  the current canonical route, and drops stale startup/deep-link UI state.
  The relaunch explicitly supplies the staged desktop app path because
  workspace Lynxtron omits it from `process.argv`. Repeated exact-owned reloads
  replaced the PID and DevTool session while keeping Settings, landing, and
  populated-thread routes with clean consoles.

## Completed — Thread header Terminal / Editor authority

- Current Lynx ordinary thread headers expose separate text-only `Terminal`
  and `Editor` buttons.
- Compare against the current Web `ChatHeader` authority rather than treating
  the Lynx controls as intentional: ordinary project threads use the
  Environment/Open-in-editor cluster, while `Terminal` text belongs to an
  editor-rail surface tab with its terminal icon.
- Remove or recompose the Lynx-only text controls through shared product
  composition. Preserve the folder and Environment affordances and avoid
  hiding capabilities that still need a reachable canonical path.
- Verify populated and empty project threads, editor rail chat/terminal tabs,
  narrow and wide windows, both themes, and keyboard/menu entry points.
- Ordinary Native thread headers now expose only the canonical files and
  Environment controls. Terminal remains reachable as an icon-bearing editor
  rail tab through the Environment Editor path.
