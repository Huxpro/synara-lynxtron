# Native Studio current-head verification

## Synchronized scope and authority

The existing Web authority and Lynx-for-Web Studio pair remains under
`shots/2026-08-14/studio/`. It established the shared wide-light composition,
including `Use a folder`, but explicitly left Native blocked. This continuation
adds a fresh exact-owned Native route and interaction cell; it does not pretend
the older browser pair used this run's snapshot.

Final Native run:

- fresh canonical server state: `.synara-fidelity-studio-native`;
- server/Web ports owned by the run: `58090` / `8891`;
- temporary `@lynx-js/lynxtron@0.0.9-dev` diagnostic host;
- Native root/app PIDs: `97077` / `97083`;
- PID-derived DevTool client: `localhost:8901`, session `1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- viewport/theme: `1280x820`, light;
- output/staged bundle SHA-256:
  `99838ab25d7b11e67e67c98dc643e4de163b6f48d88aa6afbfc69c158c92fe7a`.

## P1: duplicate Home containers

### Before

A fresh exact-owned Native cold start dispatched two concurrent
`project.create` commands 83ms apart:

- distinct command IDs;
- distinct project IDs;
- both `kind=chat`, title `Home`;
- both rooted at `/Users/bytedance`.

Read-only projection evidence confirmed two live rows, not merely duplicate
host logging.

### Root cause and fix

`ThreadsLandingPage` and `LandingComposer` both load the landing bootstrap.
The outer owner used init-data `null`, while the inner owner independently
fell back to the persisted default provider `codex`. Their React Query keys
therefore differed and both side-effectful bootstraps created a Home container.

`resolveLandingModelProvider` now resolves init data against the persisted
default once in `ThreadsLandingPage`. The resolved provider is used by the
outer query and passed to `LandingComposer`, so both owners share one query key
and React Query coalesces the bootstrap.

### After

Three fresh exact-owned runs each dispatched one Home create. The final
projection contained exactly:

- one `chat` Home at `/Users/bytedance`;
- one later `studio` Studio at
  `/Users/bytedance/Documents/Synara/Studio`;
- zero threads.

`native-landing-duplicate-home-bootstrap`: P1 contribution
`1.00 -> 0.00`.

## P1: Studio folder picker runtime crash

### Before

A real Native touch reached the rendered `Use a folder` control, but no popup
survived. Exact-client console exposed the actual failure:

`ReferenceError: FolderIcon is not defined`

The project-picker adapter referenced `FolderIcon` in group and option rows
without importing it. The trigger stayed in an impossible expanded state while
the popup subtree crashed.

### Root cause and fix

Import `FolderIcon` from the canonical Lynx icon module and add a source
contract covering both the import and chooser fallback. A temporary
mount-focus hypothesis was tested and reverted after the runtime exception
identified the real cause.

### After

The final fresh run exercised rendered controls:

1. Projects -> Studio through the sidebar segmented button at `(72,62)`;
2. `Use a folder` at `(408,560,97x28)`;
3. visible `ComposerProjectPickerPopupLynx`;
4. real search input with placeholder `Search folders`;
5. `Choose a folder` and `Don't use a folder` actions;
6. backdrop dismissal restoring `aria-expanded=false` and unmounting the
   popup.

The popup DOM was visible at `left:408px; top:300px`. A later box-model query
used its stale node ID after dismissal and correctly failed; this is a
measurement-timing limitation, not product loss.

`native-studio-folder-picker-runtime-crash`: P1 contribution
`1.00 -> 0.00`.

## Geometry and runtime

- Studio route page: `(256,0,1024x820)`;
- body: `(256,126,1024x694)`;
- header identity: `(276,14,78x18)`;
- landing composer: `(400,461,736x133)`;
- tray: `(400,536,736x58)`;
- folder trigger: `(408,560,97x28)`;
- folder label: `(435,566,63x17)`, `11px/16.5px`;
- Studio segmented button ended active and Projects inactive.

The final exact-client warning/error console was empty. The expected provider
status text still reported `codex not found in PATH`; that is isolated server
environment state, not Studio UI loss.

## Verification and cleanup

- Focused tests: `4` files, `8/8` passed.
- Native/Desktop production build: passed.
- Existing warnings only: unsupported encoded CSS properties and optional
  `bufferutil` / `utf-8-validate`.
- Output/staged bundle hashes: identical.
- Exact-owned ports `58090`, `8891`, and `8901`: released.
- Runtime, user data, server state, and probe files: removed.
- Browser lifecycle exit gate: `sessions: []`, zero owned processes.
- Screenshot count remains `100`; no screenshot was added.

Remaining Studio scope includes Native dark/1440, actual system folder-dialog
selection/cancel, first send with a selected folder, restored populated Studio
threads, and a newly synchronized three-client visual pair.

## Standard deep-link continuation

A route/deep-link matrix audit compared every route accepted by the Native
memory router with every hostname handled by the desktop shell. Studio was the
only remaining supported route without a standard deep link:

- before: `synara://studio` fell through to `/`;
- after: `synara://studio` maps directly to `/studio`.

A fresh exact-owned cold start using only `synara://studio` proved:

- Studio segmented button active, Projects inactive;
- `New Chat`, `What should we work on?`, and `Use a folder` rendered directly;
- exactly one live `studio` container at
  `/Users/bytedance/Documents/Synara/Studio`;
- zero Home container pollution;
- exact-client warning/error console empty.

The final Studio container was removed through canonical `project.delete`, and
the shell snapshot returned to 0 live projects / 0 threads.

`native-studio-deep-link-reachability`: P1 contribution
`1.00 -> 0.00`.

Focused shell/Studio/composer tests pass `19/19`; the Native/Desktop production
build passes. This closes the last route-level desktop deep-link gap found by
the router/hostname matrix.

## Native dark 1440 continuation

A fresh exact-owned run added Studio dark at `1440x900`:

- root: `SliceRoot--theme-dark SliceRoot--viewport-wide`;
- route: `(256,0,1184x900)`;
- heading: `(688,447,321x35)`, `30px/35px/400`,
  `rgb(252,252,252)`;
- composer: `(480,501,736x133)`;
- input surface: `(480,501,736x95)`, `rgb(23,23,23)`;
- tray: `(480,576,736x58)`;
- folder trigger: `(488,600,97x28)`, `Use a folder`.

The canonical snapshot contained exactly one `kind:studio`, title `Studio`
container. There was no duplicate Home/Studio bootstrap. Exact-client
warning/error console stayed empty.

`native-studio-dark-1440`: missing coverage `1.00 -> 0.00`;
product-loss contribution remains `0.00 -> 0.00`.

Two harness assumptions were rejected separately:

- a temporary IDs file without `.json` was loaded through Node `require()` and
  parsed as JavaScript instead of JSON;
- the canonical assertion expected a Home container, while Studio correctly
  owns one Studio container.

Neither changed product state or contributed product loss.

The actual system folder-dialog selection remains a host-dialog boundary for a
background run. First send and restart persistence remain open. Owned
ports/runtime/state and browser processes were removed; screenshot count
remained `100`.

## Native restart continuation

A fresh exact-owned dark `1440x900` Studio run recorded its canonical Studio
container ID, then restarted Native with the same user data and isolated server
state.

After restart:

- exactly one live project remained;
- its ID matched the first launch;
- kind/title remained `studio` / `Studio`;
- no Home container or second Studio container was created;
- root remained dark `1440x900`;
- Studio stayed active with `What should we work on?`;
- exact-client warning/error console stayed empty.

`native-studio-container-restart`: missing coverage `1.00 -> 0.00`;
product-loss contribution remains `0.00 -> 0.00`.

This closes the restart duplicate-container boundary that previously produced a
real race before the shared landing-provider bootstrap fix. Canonical,
process, browser, and screenshot-count cleanup gates passed.

## Native minimum-window continuation

A fresh exact-owned Studio run added the real `900x650` Desktop minimum.
Heading, composer, tray, and `Use a folder` remained reachable, but the
provider-health banner measured `(210,58,736x68)`:

- it intruded `46px` into the `256px` sidebar;
- it extended `46px` beyond the `900px` window;
- the same screen's composer correctly owned `(268,376,620x133)`.

`native-provider-health-banner-medium-overflow`: P1 contribution
`1.00 -> 0.00`.

The banner's fixed `736px` transcript width ignored the medium main rail.
Medium/compact banner frames now use `12px` horizontal gutters and the banner
fills that frame.

The first repair removed overflow but double-subtracted frame padding, producing
`(288,58,580x68)`. The final exact-owned build aligned exactly with the
composer rail at `(268,58,620x68)`.

The rest of the minimum Studio geometry remained:

- body: `(256,126,644x524)`;
- heading: `(418,322,321x35)`;
- composer: `(268,376,620x133)`;
- tray: `(268,451,620x58)`;
- folder trigger: `(276,475,97x28)`.

Focused tests passed `3` files / `7` tests. Native/Desktop production build
passed with registered warnings only. Output/staged SHA-256 was identical at
`f71ae0e9350527e482617036e1ffbf4ff479307b9832181d7e87a4fa36b5e354`.
Exact-client warning/error console stayed empty.

The first final-validation preflight found the preceding owned Studio/server
processes still listening because their PTYs had not been closed. The loop
stopped, closed those exact owned sessions, removed their state, and required
all three ports plus the browser gate to pass before retrying. This is retained
as harness cleanup failure, not product loss.

Canonical, process, browser, and screenshot-count cleanup gates passed after
the final run.
