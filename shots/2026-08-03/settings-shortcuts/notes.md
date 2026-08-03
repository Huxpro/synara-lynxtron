# Settings Keyboard Shortcuts — Web / Lynx / Native extension

## Scope

- New covered UI: Settings → Keyboard Shortcuts
- Canonical shared composition:
  `KeyboardShortcutsSettingsComposition`
- Data source: real `server.getConfig().keybindings`
- Browser representative cells:
  - light `1280×820`
  - dark `1440×900`
- Native representative cell:
  - light outer `1280×820`, DevTool `2560×1576`

This slice does not enter terminal, embedded browser, PDF, voice, P8-Q3,
P8-Q4, or P9-R1.

## Ownership

- Web and Lynx consume the same physical composition for:
  - search state and Escape clearing;
  - canonical shortcut section construction and filtering;
  - Command / Keybinding table order;
  - muted alternate-context rows;
  - empty-state copy;
  - split keycap rendering.
- Web keeps its DOM Elements adapter.
- Lynx maps only the leaf elements to native `view`, `text`, `input`, and
  static CSS.
- The initial implementation accidentally used a relative Elements import.
  Lynx-for-Web therefore rendered Web DOM elements despite showing the right
  content. That diagnostic build was discarded. The retained build uses the
  platform alias and contains `SharedKeyboardShortcuts*` Native classes in
  both Web and Desktop Lynx bundles.

## Product behavior

- Both clients loaded 51 rows from the same isolated server config.
- Both included the real configured command `Search projects and threads`.
- Web rendered search interaction:
  - initial 51 rows;
  - `Search projects` reduced the table to the one matching row;
  - Escape cleared the query and restored all 51 rows.
- Native exact DOM contained:
  - one searchable input;
  - 47 normal rows plus 4 muted workspace-context rows;
  - the real `Search projects and threads` entry.
- Native search input is rendered through the already-certified native Input
  primitive. This run does not claim a retained Native filtering interaction:
  showInactive DevTool touch/wheel injection did not move the Settings scroll
  owner, so the unsuccessful scroll diagnostics were deleted rather than
  retained as product evidence.

## Geometry

Both Browser cells produced the same deltas:

| Anchor | Lynx-for-Web delta | Size delta |
|---|---:|---:|
| Page title | `x +5px / y +8px` | exact `28px` box |
| Search control | `x +5px / y +5.25px` | exact `624×28px` |
| Table header | `x +5px / y +5.25px` | exact `622×33.5px` |
| First row | `x +5px / y +5.25px` | exact `622×59px` |
| Tenth row | `x +5px / y +5.25px` | exact `622×59px` |

The initial native adapter row was 54px while Web was 59px, producing
cumulative drift. That frame was discarded. Explicit line-height and row
height calibration removed the drift through at least the tenth retained row.

## Harness and gates

- Shared origin: `http://127.0.0.1:63211`
  - Web original: `/`
  - Lynx-for-Web: `/lynx/`
- Shared server: `ws://127.0.0.1:62190`
- Shared snapshot:
  `/private/tmp/synara-lynx-web-harness.SUyxxH/synara-home/dev/state.sqlite`
- Snapshot SHA-256:
  `7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`
- Browser PNG dimensions and runtime viewport/DPR were exact.
- Browser page-error files are empty.
- Web console is empty. Lynx-for-Web contains only host initialization logs
  and the known upstream deprecated-parameter warning.
- Exact-owned Native:
  - PID `81457`;
  - PID-derived client `localhost:8903`, session `1`;
  - staged bundle
    `apps/lynx/dist/desktop/main.lynx.bundle`;
  - route changes used rendered Settings and Keyboard Shortcuts controls via
    `Input.emulateTouchFromMouseEvent`;
  - error/warning console is empty.
- Focused Web tests: 2 files / 3 tests.
- Focused Lynx tests: 2 files / 12 tests.
- Lynx-for-Web and Desktop production builds passed.
- Strict reuse audit: Settings `52.64%`.
- Strict style audit: `98.07%`.
- Offline comparison gallery:
  - 8 screens / 28 comparison cells;
  - Shortcuts filter exposes 2 cells, 5 actual images, and one explicit
    missing-Native placeholder;
  - all five Shortcuts image requests returned HTTP 200;
  - gallery page errors were empty.
- Cleanup:
  - owned Browser/server/static-server/Lynxtron processes stopped;
  - ports `62190`, `63211`, and `8903` released;
  - user clients `8901` and `8902` untouched;
  - shared snapshot hash unchanged.
