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

## P1 — Cmd+R reload

- Provide a normal application-menu `CmdOrCtrl+R` reload action.
- Keep force reload separate if exposed.
- Verify the accelerator reloads the current workspace app and recovers from a
  renderer error without launching another instance or losing the current
  server connection.
