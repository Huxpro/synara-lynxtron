# Native Automations populated detail

## New scope

This loop added the first current-head exact-owned Native Automations
populated-list to read-only-detail interaction cell:

- theme: light;
- outer viewport: `1280x820`;
- state: one disabled/manual standalone automation with no runs;
- interaction: real rendered Native list-row touch opens detail;
- retained detail: prompt, Paused status, Manual cadence, project, model,
  execution settings, and empty Previous runs.

This is new Native certification coverage rather than a replay of the
2026-08-14 Web/Lynx-for-Web Automations matrix.

## Shared state and ownership

- State directory:
  `/Users/bytedance/github/synara/.synara-fidelity-automation-expanded`
- Server/Web ports: `58090` / `8891`
- Initial orchestration snapshot sequence: `4`
- Existing project: `automation-expanded-project` (`Automation Fidelity`)
- Existing thread: `automation-expanded-thread` (`Release readiness`)
- Temporary automation:
  `automation:452c8bf8-d2d0-4f24-af79-1f7720d3db16`
- Temporary definition was created through canonical `automation.create` with
  `enabled:false`, `schedule:{type:"manual"}`, and zero runs.
- No provider turn or worktree was started.
- Cleanup used canonical `automation.delete`; the final automation list was
  empty, runs remained zero, snapshot sequence remained `4`, and the original
  project/thread remained present.

Native used the temporary published `@lynx-js/lynxtron@0.0.9-dev` diagnostic
host without changing workspace dependencies. Exact-owned launch PID `62818`
owned Lynxtron PID `62826`; the PID-derived DevTool client was
`localhost:8901`, session `1`, pointing to:

`file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`

Staged bundle SHA-256 before launch:
`b60fcd3fee7461331bf601be481023868ca6172cae6e2dbf9688bf0a66e79315`.

## Comparable evidence

Current Web authority at `1280x820`, DPR 1, light:

- page: `1024x820` at `x=256`;
- main column: `704x774` at `(256,46)`;
- aside: `320x820` at `x=960`;
- title: `640x32` at `(288,78)`;
- Details heading: `y=209`;
- Previous runs heading: `y=433`;
- No runs row: `y=455`, `287x24`;
- page errors: zero.

Exact-owned Native:

- root: `SliceRoot--theme-light`;
- page: `1024x820` at `x=256`;
- main column: `704x820` at `x=256`;
- prompt scroller: `704x774` at `(256,46)`;
- aside: `320x820` at `x=960`;
- title: `640x32` at `(288,78)`;
- Details heading: `y=208`;
- Previous runs heading: `y=432`;
- No runs row: `y=454`, with `12px/16px`, normal weight, and
  `rgba(13,13,13,0.596078)`;
- warning/error console: zero.

The one-pixel Details/Previous-runs vertical difference is the existing Native
whole-pixel rhythm and is accepted rendering noise, not a product loss. The
main/aside split, title, content geometry, copy, state, and light tokens match
the authority contract.

The retained Native frame is `2560x1640` at
`native-light-1280.png`. It consumes the repository's 100th and final local
screenshot slot; later loops must delete or consolidate evidence before
capturing another local frame.

## Runtime compatibility result

The previous Native startup failures from missing `crypto` and `Intl` are
closed in this newly exercised route. The exact client rendered `Manual`,
`Paused`, and `No runs yet.` without an `Intl` global, and the console remained
empty through list hydration and the real list-to-detail interaction.

No new P0/P1/P2 product loss was found in this Native cell:

- `native-automations-populated-detail-coverage`: missing coverage
  `1.00 -> 0.00`;
- component product-loss contribution: `0.00 -> 0.00`.

## Native Resume/Pause roundtrip

A follow-up exact-owned run added the first current-head Native status-mutation
roundtrip without triggering a provider:

1. Canonical `automation.create` produced
   `automation:8e0d7f7e-a566-4bd4-b52d-3e54220a1d3d` as a disabled/manual
   definition with zero runs.
2. The rendered `720x44` Paused row opened through a real DevTool touch at its
   box center.
3. The rendered Resume button (`69x28` border box at `(1199,9)`) received a
   real touch. Native dispatched canonical `automation.update {enabled:true}`;
   the server projection changed to enabled, the detail changed immediately to
   Active/Pause, and runs remained zero.
4. The rendered Pause button (`57x28` border box at `(1211,9)`) received a real
   touch. Native dispatched canonical `automation.update {enabled:false}`;
   the projection and detail returned immediately to Paused/Resume, and runs
   remained zero.
5. The exact-client warning/error console stayed empty throughout.
6. Canonical `automation.delete` restored zero definitions and zero runs;
   snapshot sequence remained `4`, and the original project/thread remained
   present.

An initial server-only preflight omitted `VITE_DEV_SERVER_URL`, selecting the
isolated `userdata/` database instead of the intended `dev/` database.
Canonical create correctly failed with `Automation project was not found`.
No definition was created. The run was stopped, the newly initialized
sequence-zero `userdata/` directory was removed, and the server was restarted
only after the snapshot gate proved sequence `4` and the expected project.
This is retained as a harness identity catch, not a product failure.

- `native-automations-resume-pause-interaction`: missing coverage
  `1.00 -> 0.00`;
- component product-loss contribution: `0.00 -> 0.00`.

## Native Edit/Cancel roundtrip

Another exact-owned run added the first current-head Native Edit dialog
initial-value and cancellation proof:

1. Canonical `automation.create` produced a disabled/manual definition named
   `Native edit original` with prompt `Original native edit prompt.` and zero
   runs.
2. Real touches opened the rendered list row and the rendered Edit control.
3. The Native dialog retained the canonical original values:
   - Name input `value` and `default-value`: `Native edit original`;
   - Prompt textarea `default-value`: `Original native edit prompt.`.
4. Save was initially disabled because no field had changed.
5. The rendered Cancel button (`66x32` border box at `(704,581)`) received a
   real touch. The dialog unmounted while the detail remained open.
6. The server definition's name, prompt, and `updatedAt` were byte-for-byte
   unchanged; runs remained zero and the exact-client warning/error console
   stayed empty.
7. Canonical delete restored zero definitions and zero runs.

- `native-automations-edit-cancel-interaction`: missing coverage
  `1.00 -> 0.00`;
- component product-loss contribution: `0.00 -> 0.00`.

## Compact Web and Lynx-for-Web detail

Active discovery added a new `320x568`, DPR 1, light list-to-detail cell for
both browser renderers. The canonical disabled/manual fixture was again created
and deleted through automation RPCs, produced zero runs, and preserved snapshot
sequence `4`.

The first valid compact frames exposed a shared P1 usability loss rather than
a renderer mismatch:

- Web kept the detail root in a fixed horizontal row with a `320px` aside. Its
  prompt main collapsed to `48px`, and the `h1` content width collapsed to
  `0px` while growing to `96px` tall.
- Lynx-for-Web used the same fixed row and aside contract. Its main collapsed
  to `0px`; title/prompt widths were `0px`, producing `704px` and `864px`
  vertical text boxes behind the aside.
- Both pages avoided document-level horizontal overflow only because the
  fixed aside fully covered the viewport. This was not an acceptable
  responsive layout.

Both renderers now use the same compact composition:

- detail root stacks vertically below the small-screen breakpoint;
- prompt pane is `320x200`, with a `320x46` header and `320x154` scroller;
- title is visible at `256px` wide in Lynx and `272px` wide in Web;
- detail pane is `320x368` starting at `y=200`;
- the details scroller is `320x322` starting at `y=246`;
- the vertical seam becomes a top seam on compact and remains a left seam on
  wider screens.

Web main width changed `48px -> 320px`; Lynx main width changed
`0px -> 320px`. Both clients retained the canonical copy, real list-row
navigation, light theme, and zero page errors. Lynx relay remained one
connection with zero pending requests and no transport/RPC error.

- `shared-automation-detail-compact-collapse`: P1 contribution
  `1.00 -> 0.00`;
- Web detail layout contribution: `1.00 -> 0.00`;
- Lynx detail layout contribution: `1.00 -> 0.00`.

No screenshot was added because the repository was already at its 100-image
limit. Geometry, runtime, and behavior evidence was retained without exceeding
the cap.

## Native stale deep link and recovery

An exact-owned cold start with
`synara://automations/automation%3Astale-native` added the first current-head
Native stale-definition recovery cell against an empty canonical automation
list:

- the startup route rendered `AutomationDetailNotFoundPage`;
- the canonical `Automation not found.` copy was visible;
- the rendered Back to automations button had a `141x28` border box at
  `(698,434)`;
- a real touch at its center navigated to the ordinary Automations empty state;
- the not-found subtree unmounted, the Automations page remained mounted, and
  the exact-client warning/error console stayed empty;
- the server list remained zero definitions and zero runs.

The DevTool wrapper node around the button did not expose a box model, while
the actual interactive VIEW child did. That is a measurement boundary, not a
product defect.

- `native-automations-stale-link-recovery`: missing coverage
  `1.00 -> 0.00`;
- component product-loss contribution: `0.00 -> 0.00`.

## Native dark list and detail

An isolated exact-owned user-data directory preloaded only the canonical
`synara:theme` value `dark`, adding the first current-head Native Automations
dark-theme list-to-detail cell at `1280x820`:

- root resolved `SliceRoot--theme-dark`;
- canvas/background resolved `rgb(16,16,16)`;
- primary foreground resolved `rgb(252,252,252)`;
- list title remained `24px/32px`, and the real row retained the exact
  `720x44` border geometry at `(408,160)`;
- a real row touch opened detail;
- detail page remained `1024x820`, main/aside remained `704px + 320px`, and
  title remained `(288,78,640x32)`;
- detail title resolved `rgb(252,252,252)`, `24px/32px/400`;
- group and No-runs copy resolved
  `rgba(252,252,252,0.576471)`, `12px/16px`, with the group at weight `500`;
- exact-client warning/error console stayed empty.

Canonical delete restored zero definitions and zero runs. The isolated KV and
runtime directories were removed without changing user theme state.

- `native-automations-dark-list-detail`: missing coverage `1.00 -> 0.00`;
- component product-loss contribution: `0.00 -> 0.00`.

## Native dark 1440x900

The larger-size Native axis was then exercised with isolated dark theme and
persisted `1440x900` window bounds:

- root reported `data-viewport-width=1440`,
  `data-viewport-height=900`, and `SliceRoot--theme-dark`;
- sidebar remained `256px`, leaving an `1184x900` Automations page;
- list content remained centered at `x=464` with a `768px` outer rail;
- title and row inner rails remained `704px` wide at `x=488`;
- a real row touch opened detail;
- detail split remained `864px + 320px`;
- prompt/title remained bounded to `704px` at `x=288`, instead of stretching
  with the extra viewport width;
- aside content remained the canonical `287px` rail and No-runs geometry;
- exact-client warning/error console stayed empty.

Canonical cleanup restored zero definitions/runs, and the isolated KV/window
state/runtime directories were removed.

- `native-automations-dark-1440-detail`: missing coverage `1.00 -> 0.00`;
- component product-loss contribution: `0.00 -> 0.00`.

## Native create dialog open and cancel

An exact-owned run against the empty automation list added the first
current-head Native create-dialog open/cancel proof:

- the rendered New automation button had a `117x28` border box and opened
  through a real touch;
- the dialog exposed Name and Prompt inputs, the selected
  `Automation Fidelity` project, model picker, Manual/Daily/Weekdays,
  Auto/Worktree/Local, Standalone/Heartbeat, time, max iterations,
  stop-on-error, interaction mode, and permissions;
- model discovery settled from the transient `Choose model` label to
  `GPT-5.6 Sol`;
- Daily, Auto, Standalone, Unlimited, On, Default, and Approval required were
  selected by default;
- Name and Prompt were empty, so Create automation remained disabled;
- the rendered Cancel button (`66x32` at `(626,632)`) received a real touch,
  unmounted the dialog, and restored the ordinary empty Automations state;
- the server remained zero definitions and zero runs, and the exact-client
  warning/error console stayed empty.

The model label was intentionally checked after discovery settled; the
transient `Choose model` state is loading behavior, not missing model
selection.

- `native-automations-create-dialog-cancel`: missing coverage
  `1.00 -> 0.00`;
- component product-loss contribution: `0.00 -> 0.00`.

## Harness losses kept separate

The first Lynx-for-Web probes were invalid for three independent harness
reasons:

- `body.innerText` and light-DOM selectors do not see Lynx `raw-text[text]`
  values or the product tree inside `lynx-view.shadowRoot`;
- `localhost:8080` resolved to a pre-existing IPv6 Rsbuild dev server while
  the owned static server listened on IPv4, so some probes loaded a stale
  endpoint and bundle;
- moving the static server to another origin without updating the server's
  configured `devUrl` caused the WebSocket origin gate to reject reconnects.

None of those frames are counted as product failures or passes. A corrected
shadow-root probe on an unambiguous static origin, paired with the same origin
as the server's configured `devUrl`, proved the real Automations page:

- `AutomationsPage` at `(256,0,1024x820)`;
- title at `(408,78,720x32)`;
- canonical `No automations yet` state;
- relay `socketState=1`, one connection, zero pending requests, and no
  transport/RPC error.

The investigation did expose one real harness packaging loss: the standalone
Web build did not stage the Web-owned absolute icon URLs. Requests for
`compose-pencil`, `columns-3-wide`, `magnifying-glass`, and `clock` returned
404. The Web output now copies both canonical `central-icons-reversed` and
`central-icons-fill` directories; all four requests return 200 after the
explicit production build.

Every browser attempt ran through `bun run browser:run -- ...`. Successful,
failed, and shadow-aware probes all ended with `sessions: []` and zero
agent-browser-owned processes.

## Verification

- Native deep-link parser focused test: `14/14`.
- Explicit Lynx-for-Web production build: passed.
- Web authority dimensions/theme/content: passed.
- Native PID/session/bundle identity: passed.
- Native rendered list-row touch to detail: passed.
- Native rendered Resume/Pause mutation roundtrip: passed.
- Native Edit initial values and Cancel no-mutation path: passed.
- Compact Web/Lynx-for-Web detail composition: passed after shared fix.
- Native stale deep-link not-found and Back recovery: passed.
- Native dark list/detail geometry and token resolution: passed.
- Native dark `1440x900` list/detail geometry: passed.
- Native create dialog structure and Cancel no-mutation path: passed.
- Native warning/error console: zero.
- Corrected Lynx-for-Web shadow-root/relay cell: passed.
- Lynx-for-Web shared icon requests: `404 -> 200`.
- Canonical fixture cleanup: passed.
- Local screenshot count: `100`.
