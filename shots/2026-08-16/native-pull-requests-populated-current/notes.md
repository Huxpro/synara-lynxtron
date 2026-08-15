# Native Pull Requests populated list and detail

## New scope

This loop added the first current-head exact-owned Native populated Pull
Requests list-to-detail-to-list interaction at `1280x820`, light.

The canonical `pullRequests.list` RPC returned:

- 50 open entries;
- 2 repository batches;
- zero source errors;
- first entry `Emanuele-web04/synara#693`,
  `docs: refresh provider architecture`.

No pull request mutation was performed.

## Exact-owned identity

- State directory:
  `/Users/bytedance/github/synara/.synara-fidelity-automation-expanded`
- Server: `127.0.0.1:58090`
- Native diagnostic host: temporary published
  `@lynx-js/lynxtron@0.0.9-dev`
- PID-derived DevTool client: `localhost:8901`, session `1`
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`

## List evidence

- `FeaturePage SharedPrRoutePage` rendered with 50 real interactive rows.
- First row accessible identity:
  `docs: refresh provider architecture, pull request #693`.
- First row border box: `960x48` at `(272,165)`.
- Filters retained All/Reviewing/Authored and Open/Closed/Merged, search, and
  project filter.
- The canonical list had zero source errors.

## Detail interaction

A real touch at the first row center `(752,189)`:

- marked the row as the current pull request;
- dispatched canonical `pullRequests.detail` for project
  `automation-expanded-project`, repository `Emanuele-web04/synara`, number
  `693`;
- opened `SharedPrRouteBody--detail-open`;
- retained the list behind a `512px` detail dock;
- rendered Summary, Timeline, and Code tabs with Summary selected.

Measured geometry:

- route body: `1024x774` at `(256,46)`;
- detail dock: `512x774` at `(768,46)`;
- dock header: `511x48` at `(769,46)`;
- tab group: `218x28` at `(777,56)`;
- close control: `28x28` at `(1244,56)`.

A real touch on Close pull request panel at `(1258,70)` removed the detail
dock and restored all 50 list rows. The exact-client warning/error console
remained empty throughout.

## Classification

- `native-pull-requests-populated-list-detail`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No P0/P1/P2 product loss was found in this cell.
- No screenshot was added because the repository remains at its 100-image
  local cap.
