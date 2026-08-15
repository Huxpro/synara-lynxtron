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

## Native detail tab roundtrip

A follow-up exact-owned run exercised the populated detail tabs with real
touches:

1. Summary was initially selected.
2. Timeline touch selected Timeline and mounted real
   `SharedPrTimelineRoot` events.
3. Code touch selected Code and mounted `SharedPrCodeRoot`; the host dispatched
   canonical `pullRequests.diff` for the selected PR.
4. Summary touch restored Summary, including overview, description, checks,
   and comments, while Timeline and Code roots unmounted.

The exact-client warning/error console remained empty throughout. No PR action,
pin, comment, review, or state mutation was performed.

The live upstream list changed between the preceding list/detail run and this
tab run: new PRs `#698`, `#697`, and `#696` moved ahead of `#693`. The current
first row and detail were therefore `#697`, and the Code RPC correctly requested
`#697`. This was verified against a fresh canonical list before classification;
it is external list evolution, not row recycling or detail identity loss.

- `native-pull-requests-detail-tabs`: missing coverage `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.

## Native Pin/Unpin roundtrip

A follow-up exact-owned run added the first current-head Native PR pin
roundtrip using the current canonical first-row identity rather than a list
index:

- PR `Emanuele-web04/synara#699`, project
  `automation-expanded-project`;
- initial canonical state `isPinned:false`;
- initial Native control: `Pin pull request #699 in Automation Fidelity`,
  `aria-pressed=false`, `Not pinned`, `28x28`.

A real touch pinned the PR through canonical `pullRequests.setPinned`:

- canonical list changed to `isPinned:true`;
- Native changed to `SharedPrPin--pinned`,
  `aria-pressed=true`, `Pinned`, and the Unpin label;
- the row moved from its ordinary group to the pinned group, shifting the pin
  control from `y=225` to `y=175`. That membership movement is expected.

A second real touch used the new pinned-group box center and restored:

- canonical `isPinned:false`;
- `SharedPrPin--unpinned`;
- `aria-pressed=false`, `Not pinned`, and the original Pin label.

The exact-client warning/error console stayed empty. The final canonical state
matches the recorded initial state; no GitHub PR data was changed.

- `native-pull-requests-pin-roundtrip`: missing coverage `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.

## Native populated dark list and detail

An isolated exact-owned KV preloaded only `synara:theme=dark`, adding the first
current-head populated Native PR dark-theme list-to-detail cell at `1280x820`:

- root/canvas resolved `rgb(16,16,16)` with primary foreground
  `rgb(252,252,252)`;
- route title remained `14px/20px` at `(276,13)`;
- 50 interactive rows rendered, and the current first row retained the
  `960x48` geometry at `(272,165)`;
- a real row touch opened the `512x774` detail dock;
- dock surface resolved `rgb(17,17,17)` with foreground `rgb(252,252,252)`;
- Summary title resolved `18px/24px/600`;
- section title resolved `14px/20px/500`, all in the dark primary foreground;
- Summary, Timeline, and Code tabs retained their exact `218x28` group;
- exact-client warning/error console stayed empty.

The Summary probe waited for the canonical detail RPC to settle rather than
treating the initial tabs-only loading frame as final evidence. No PR mutation
was performed. The isolated theme/runtime directories were removed.

- `native-pull-requests-populated-dark-detail`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
