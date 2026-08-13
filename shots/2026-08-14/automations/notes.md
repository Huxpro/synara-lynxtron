# Automations list fidelity

## New scope

- Web authority and Lynx-for-Web now cover `/automations`.
- Retained comparable states:
  - empty;
  - populated list with two active daily automations.
  - paused list with one disabled automation.
  - read-only detail with no previous runs.
  - paused detail after a real rendered Pause action.
- Still missing and not claimed by this slice:
  - create/edit dialog;
  - detail mutations other than pause/resume, including delete and run now;
  - detail with previous runs;
  - paused and needs-review list visual cells;
  - Native certification.

## Shared data and capture identity

- Isolated server: `ws://127.0.0.1:58960`
- Web origin: `http://localhost:8921`
- Server instance:
  `8632a46a-5bfb-4f4d-afe7-8ee7e91df72f`
- Initial orchestration snapshot sequence: `0`
- Web, Lynx-for-Web, and Native-provenance preflight all reported that same
  server instance and sequence.
- Pause/resume used a second isolated run at `ws://127.0.0.1:58980` and
  `http://localhost:9061`, with the same preflight rules.
- Populated state was created through canonical `project.create` and
  `automation.create` RPCs. Cleanup used `automation.delete`; SQLite was never
  written directly.
- Browser sessions used `1280×820`, DPR 1, dark theme, and produced exact
  `1280×820` PNGs.

## Behavior

- Initial Lynx `refetchInterval` did not update an already-open page after a
  canonical automation create. Reloading did show the new row, proving data and
  projection correctness but exposing a live-refresh reliability loss.
- The fix uses the established host-backed timer path. In the retained runtime,
  an already-open Lynx page changed from one to two rows after a canonical
  create without reload.
- The hardened scheduler was separately reverified from zero to one row without
  reload after React Doctor review.
- Pause/resume was exercised through the rendered Lynx detail button and
  canonical `automation.update`: Active → Paused → Active, with no reload and
  no product console error.
- Delete was exercised through the rendered Lynx detail button. The Web-only
  harness now exposes the same confirm contract as Native:
  - Cancel preserved the detail and definition.
  - Confirm dispatched canonical `automation.delete`, navigated to the list,
    and rendered `No automations yet`.
- The confirm dialog is harness/platform UI rather than a product screen, so
  this behavior proof does not add or score a screenshot story.

## Geometry and visual classification

After calibration, Web and Lynx-for-Web matched exactly for:

- header: `x=256`, `y=0`, `1024×46`;
- page title: `x=408`, `y=78`, `720×32`;
- section title: `x=408`, `y=134`, `720×24`;
- list rows: `x=408`, `720×44`, starting at `y=160`.

Final full-frame parity:

- empty: `98.7281760620915%`;
- populated list: `98.63298312211063%`.
- read-only detail: `98.41580160011159%`.
- paused detail: `98.98107763430575%`.
- paused list: `99.169299976088%`.

The detail cell also matched the two `46px` headers, `704px + 320px`
columns, prompt title geometry, and the Status group exactly. Details and
Previous runs differed by at most `1px` vertically after the Web schedule
anatomy and timestamp copy moved into the shared projection.

The remaining pixel distance is accepted close rendering noise, not a P0/P1
product loss. The missing detail/create/Native cells remain explicit coverage
debt.

## Evidence

Remote asset commits: `5341ec9`, `632a003`, `494974b`, and `fcfd182`.

- `shots/2026-08-14/automations/empty/web-dark-1280.png`
- `shots/2026-08-14/automations/empty/lynx-dark-1280.png`
- `shots/2026-08-14/automations/list/web-dark-1280.png`
- `shots/2026-08-14/automations/list/lynx-dark-1280.png`
- `shots/2026-08-14/automations/list-paused/web-dark-1280.png`
- `shots/2026-08-14/automations/list-paused/lynx-dark-1280.png`
- `shots/2026-08-14/automations/detail/web-dark-1280.png`
- `shots/2026-08-14/automations/detail/lynx-dark-1280.png`
- `shots/2026-08-14/automations/detail-paused/web-dark-1280.png`
- `shots/2026-08-14/automations/detail-paused/lynx-dark-1280.png`

## Gates

- Shared projection tests: 2/2.
- Lynx focused tests: 8/8 in the final grouped run.
- Full workspace production build: 6/6.
- Delete focused tests: 19/19 for the combined detail and Web-host dialog
  contracts.
- Web and Lynx slice production builds passed after React Doctor fixes.
- React Doctor new warnings were reduced from six to one; the remaining
  `prefer-useReducer` warning is the pre-existing state shape of the Web
  Automations route.
- Web console had no page errors.
- Lynx-for-Web console had only the known upstream deprecated initialization
  warning.
