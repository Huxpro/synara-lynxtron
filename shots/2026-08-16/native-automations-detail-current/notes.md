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

## Native minimum-window create dialog

A fresh exact-owned run added the create dialog at the real `900x650` Desktop
minimum with one canonical project and zero automation definitions/runs.

The real New automation control opened:

- dialog: `(240,65,420x520)`;
- panel: `(257,122,386x402)`;
- footer: `(257,538,386x31)`;
- all fields through the final summary remained inside the dialog;
- Cancel and disabled Create automation controls remained visible.

The precise rendered Cancel button closed the dialog, restored the empty
Automations route, and left `automation.list` at zero definitions / zero runs.
Exact-client warning/error console stayed empty.

`native-automations-create-dialog-minimum-window`: missing coverage
`1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.

Canonical project cleanup and all process/browser gates passed; screenshot count
remained `100`.
- Native warning/error console: zero.
- Corrected Lynx-for-Web shadow-root/relay cell: passed.
- Lynx-for-Web shared icon requests: `404 -> 200`.
- Canonical fixture cleanup: passed.
- Local screenshot count: `100`.

## Native minimum-window Heartbeat reachability

Active discovery expanded the same exact-owned `900x650` create-dialog cell
from the default Standalone state into the dynamic Heartbeat state.

The initial Native layout exposed a P1 product loss:

- dialog: `(240,65,420x520)`;
- panel: `(257,122,386x402)`;
- footer: `(257,538,386x31)`;
- Heartbeat choice: `(349,620,79x30)`.

Heartbeat was below both the panel and dialog. A real touch therefore landed on
the backdrop and closed the dialog instead of changing mode.

The first attempted repair correctly introduced a scroll owner but allowed the
flex child to collapse to zero height. Exact Native verification rejected that
intermediate state: the dialog shrank to `137px`, the panel to `16px`, and the
Heartbeat choice remained outside the touchable viewport. This was kept as a
failed product-fix iteration, not passing evidence. A later fixed-node-id touch
also targeted a stale node after the model control rerendered; that operation
error is classified as harness error and contributes no product result.

The final repair preserves the shared `DialogPanel` scroll contract, gives the
create dialog an explicit Native-supported height budget, and gives the
medium/compact textarea an explicit `56px` height rather than relying on an
ineffective minimum. The final exact-owned production bundle
`6c0997a008f1f357e5f06a4a2f80f1a4c4fe995e0861268f6aff1a2fdbc80f95`
produced:

- dialog: `(240,16,420x618)`;
- panel: `(257,74,386x420)`;
- Heartbeat choice: `(345,424,75x26)`, fully inside the panel;
- footer: `(257,508,386x32)`;
- Cancel: `(436,508,66x32)`.

A real touch at the live Heartbeat box center `(382.5,437)` rendered both
`Target thread` and `Stop when`. The dialog, panel, footer, and Cancel control
remained mounted. Exact-client warning/error console was empty. Read-only
SQLite projection after the interaction confirmed
`automation_definitions=0` and `automation_runs=0`; no automation was created.

- `native-automations-heartbeat-minimum-reachability`: P1 contribution
  `1.00 -> 0.00`.
- Focused validation: `2` files / `20` tests passed.
- Native/Desktop production build passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- The repository-wide browser lifecycle gate passed at both loop entry and
  exit: every discovery, fast, and Native loop runs
  `bun run browser:cleanup`; every browser command runs through
  `bun run browser:run -- agent-browser ...`; any non-empty session list or
  agent-browser-owned process blocks evidence, commit, push, and the next loop.
- No browser was opened in this Native-only slice. Final state was
  `sessions: []`, zero agent-browser-owned processes, and all owned ports free.
  Local screenshot count remained `100`.

## Heartbeat target selection and detail stop condition

Active discovery continued beyond Heartbeat mode reachability into a new
interaction/state combination at the real `900x650` Desktop minimum:

- one canonical project, `Heartbeat Create Project`;
- one canonical target thread, `Heartbeat Create Target`;
- Heartbeat mode;
- target-thread selection;
- an AI-evaluated completion policy, `Thread reports COMPLETE`;
- the populated automation list and detail surfaces in Web authority and
  Native.

Preflight proved both renderers used the same isolated server on
`127.0.0.1:58090`, the same canonical project/thread IDs (`hbc-p` / `hbc-t`),
the same light theme and `900x650` logical viewport, and zero initial
definitions/runs. The Native client was derived from the owned Lynxtron PID,
not a remembered DevTool port.

Native real touches opened the create dialog, selected Heartbeat, and selected
`Heartbeat Create Target`; the choice exposed `Selected` in its accessibility
value. The dynamic form then measured:

- panel: `(257,74,386x420)`;
- target choice: `(257,470,155x26)`;
- Stop when input: `(257,516,386x32)`;
- summary: `(257,784,386x48)`;
- fixed footer: `(257,508,386x32)`.

The DevTool-supported `DOM.scrollIntoViewIfNeeded`, wheel events, touch drags,
and PID-targeted inactive macOS scroll events did not move the Native
`scroll-view`. The panel itself retained `scroll-y=true`, a `404px` computed
height, and a `420px` maximum. macOS Accessibility exposed only the Lynxtron
host window, not the Lynx content tree. Therefore inactive Native scrolling and
typing remain a harness capability gap; this loop does not claim Native
end-to-end creation and does not count the failed injections as product loss.

Web authority provided the equivalent fully operable Heartbeat path. Real
rendered controls selected Heartbeat and the same target thread, entered the
same stop condition, and created `Heartbeat creation proof`. Canonical
projection confirmed:

- `mode=heartbeat`;
- `target_thread_id=hbc-t`;
- `completion_policy_json` =
  `{"type":"ai-evaluated","stopWhen":"Thread reports COMPLETE","confidenceThreshold":0.8}`;
- zero runs.

The definition synchronized into Native through the shared server without a
restart. A real Native row touch opened detail at `900x650`. Before the fix,
Web authority displayed `Stop when` and `Thread reports COMPLETE`, while Native
detail omitted the condition entirely despite receiving the same definition.
This is a P1 product loss: Native users could not audit the condition that
terminates a Heartbeat automation.

Root cause was the shared `projectAutomationDetail` projection dropping
`completionPolicy`; it was not a transport or renderer data-loss issue. The
shared projection now adds `Stop when` after `Mode` for Heartbeat definitions
whose policy is `ai-evaluated`.

Final exact-owned Native verification on bundle
`841c1809cb39adb6b0e015d61b9e5f589ef548a49f465eabb40bf8407e035d2a`
rendered:

- detail page: `(256,0,644x650)`;
- detail aside: `(580,0,320x650)`;
- aside scroller: `(580,46,320x604)`;
- Stop when row: `(597,441,287x30)`;
- value: `Thread reports COMPLETE`.

Exact-client warning/error console remained empty.

- `native-automations-heartbeat-stop-condition-detail`: P1 contribution
  `1.00 -> 0.00`.
- `native-automations-heartbeat-create-input-scroll`: missing coverage remains
  `1.00`; blocked by the currently unavailable inactive Native input/scroll
  harness, not classified as a product loss.
- Shared projection focused test: `1` file / `6` tests passed.
- Lynx route focused test: `1` file / `6` tests passed.
- Native/Desktop production build passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- All agent-browser attempts ran through `browser:run`; successful and failed
  harness probes returned to `sessions: []` and zero owned browser processes.
- Canonical API cleanup returned zero visible definitions/runs. The persisted
  definition and project rows were soft-deleted as designed, then the isolated
  state/runtime/user directories were removed.
- Final owned ports `58090`, `8891`, and `8901` were free.
- No screenshots were retained; local screenshot count remained `100`.

## Hourly schedule parity and pause roundtrip

Active discovery added an enabled `interval` schedule whose
`everySeconds=3600`, the canonical Hourly preset, at `900x650`.

Web authority used the same isolated snapshot and rendered:

- Status `Active`;
- a future Today Next run;
- the selected schedule value `hourly`;
- action `Pause`.

The body text contained all schedule options because they are native select
options. An initial assertion incorrectly expected the static text sequence
`Repeats\nHourly`; the actual selected value was correctly exposed through the
select control as `hourly`. That assertion failure is harness error, not
product loss.

Exact-owned Native detail rendered:

- Status `Active`;
- a future Today Next run;
- Repeats `Hourly`;
- action `Pause`.

Real Native touches completed a bidirectional lifecycle roundtrip:

- Pause at `(859.5,23)` changed to Paused/Resume;
- Resume at `(853.5,23)` restored Active/Pause;
- Repeats remained `Hourly`.

Exact-client warning/error console stayed empty.

- `native-automations-hourly-pause-resume`: missing coverage
  `1.00 -> 0.00`.
- Component product-loss contribution remained `0.00 -> 0.00`.
- Shared projection tests passed `1` file / `6` tests.
- Lynx route tests passed `1` file / `6` tests.
- Native/Desktop production build passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- Browser attempts returned to `sessions: []` with zero owned processes.
- Canonical cleanup returned zero visible definitions/runs; fixture state,
  runtime, and user-data directories were removed. Owned ports `58090` and
  `8891` were free.
- Port `8901` was occupied by an unrelated t3code Lynxtron
  (`/var/.../t3-mts-product-sNMTGX/desktop`, PID `18721`). It was not
  terminated and is external contention, not a Synara leak.
- No screenshots were retained; local screenshot count remained `100`.

## Manual schedule parity and pause roundtrip

Active discovery added a manual schedule at the real `900x650` Desktop
minimum. The canonical definition was enabled, used
`{"type":"manual"}`, had `nextRunAt=null`, and had zero runs.

The first Web authority attempt reached only the shell before hydration and is
classified as harness incompleteness. A fresh named session with a longer wait
used the same server snapshot, light theme, and viewport and rendered:

- Status `Active`;
- Next run `—`;
- Repeats `Manual`;
- a real Manual schedule select value;
- action `Pause`.

Exact-owned Native detail rendered the same semantic state:

- Status `Active`;
- Next run `—`;
- Repeats `Manual`;
- action `Pause`.

Real Native touches then completed a bidirectional mutation roundtrip:

- Pause at `(859.5,23)` changed Status to `Paused` and action to `Resume`;
- Resume at `(853.5,23)` restored Status `Active` and action `Pause`.

After the roundtrip, read-only canonical projection remained:

- `enabled=1`;
- `next_run_at=null`;
- `schedule_json={"type":"manual"}`.

Exact-client warning/error console remained empty.

- `native-automations-manual-pause-resume`: missing coverage
  `1.00 -> 0.00`.
- Component product-loss contribution remained `0.00 -> 0.00`.
- Shared projection tests passed `1` file / `6` tests.
- Lynx route tests passed `1` file / `6` tests.
- Native/Desktop production build passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- All browser attempts ran through `browser:run` and returned to
  `sessions: []` with zero agent-browser-owned processes.
- Canonical cleanup returned zero visible definitions/runs; fixture state,
  runtime, and user-data directories were removed. Owned ports `58090`,
  `8891`, and `8901` were free.
- No screenshots were retained; local screenshot count remained `100`.

## Future once schedule parity

Active discovery added a new schedule × lifecycle × viewport combination: an
enabled future one-time automation at the real `900x650` Desktop minimum.

The canonical fixture used schedule:

`{"type":"once","runAt":"2026-08-17T05:38:36.087Z"}`

with `nextRunAt` equal to the same instant and zero runs.

Web authority used the same isolated server, light theme, `900x650` viewport,
project, and automation definition. Its valid detail cell rendered:

- Status `Scheduled`;
- Next run `Tomorrow at 02:38 PM`;
- Repeats `Once`;
- a real `datetime-local` Run at control with value
  `2026-08-17T14:38:36`;
- no Pause or Resume action.

An earlier authority probe looked for static labels in an interactive-only
accessibility snapshot and exited before the DOM probe. That attempt is
classified as harness assertion error and contributes no product result.

Exact-owned Native detail rendered:

- detail page `(256,0,644x650)`;
- aside `(580,0,320x650)`;
- aside scroller `(580,46,320x604)`;
- Status `Scheduled`;
- Next run `Tomorrow at 02:38 PM`;
- Repeats `Once`;
- Run at `Aug 17, 2026, 2:38 PM`;
- Run at row `(597,320,287x30)`;
- no Pause or Resume action.

The Web control and Native formatted read-only value are an intentional
renderer interaction difference; schedule identity and lifecycle semantics
match. Exact-client warning/error console was empty.

- `native-automations-future-once-detail`: missing coverage `1.00 -> 0.00`.
- Component product-loss contribution remained `0.00 -> 0.00`.
- Shared projection tests passed `1` file / `6` tests.
- Lynx route tests passed `1` file / `6` tests.
- Native/Desktop production build passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- All browser attempts ran through `browser:run` and returned to
  `sessions: []` with zero agent-browser-owned processes.
- Canonical cleanup returned zero visible definitions/runs; the fixture project
  and all isolated state/runtime/user directories were removed. Owned ports
  `58090`, `8891`, and `8901` were free.
- No screenshots were retained; local screenshot count remained `100`.

## Pause cold-restart persistence

Active discovery then moved from edit parity to a new lifecycle state:
pause followed by an exact-owned Native cold restart.

The isolated fixture was an enabled standalone daily automation,
`Pause restart proof`, with a future persisted `next_run_at` and zero runs.
Initial Native detail at `900x650` rendered Status `Active` and the real Pause
control.

A real Native touch on Pause sent the canonical update
`{enabled:false}`. The live detail changed to:

- Status `Paused`;
- action `Resume`.

Read-only SQLite projection confirmed `enabled=0`. The stored
`next_run_at` remained present, which is persistence-layer behavior rather than
visible scheduling state.

The owned Lynxtron process was then stopped and cold-started against the same
production bundle, isolated server snapshot, and user-data directory. After
restart Native restored:

- Status `Paused`;
- action `Resume`;
- `Next run` value `—`, proving the detail projection did not expose the stale
  persisted timestamp while disabled.

Exact-client warning/error console remained empty. Bundle SHA-256:
`652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.

- `native-automations-pause-cold-restart`: missing coverage
  `1.00 -> 0.00`.
- Component product-loss contribution remained `0.00 -> 0.00`.
- This was a real touch, canonical mutation, process restart, and post-restart
  UI check; tests or stored state alone were not used as proof.
- Canonical cleanup returned zero visible definitions/runs; the fixture project
  and all isolated state/runtime/user directories were removed. Owned ports
  `58090`, `8891`, and `8901` were free, and browser state ended at
  `sessions: []` with zero owned processes.
- No screenshots were retained; local screenshot count remained `100`.

## Heartbeat Stop when edit parity

The next discovery loop reused the same semantic Heartbeat state but exercised
a different capability: editing the saved completion policy.

An isolated canonical fixture contained:

- project `Heartbeat Edit Project` (`hbe-p`);
- target thread `Heartbeat Edit Target` (`hbe-t`);
- automation `Heartbeat edit proof`;
- `mode=heartbeat`;
- `completionPolicy.stopWhen=Original stop condition`;
- zero runs.

At Web authority `900x650`, the detail surface exposed a real editable textbox
with placeholder `Never` and value `Original stop condition`. The initial
Native detail showed the same read-only condition after the previous fix, but a
real touch on `Edit` opened a dialog whose description and controls were
limited to Name and Prompt. There was no Stop when field or completion-policy
update path. This was a P1 capability loss: Native users could audit the
Heartbeat termination rule but could not modify it as they could in Web
authority.

Root cause was local to `AutomationEditDialog`: it owned only name/prompt state,
dirty checking, and update payload construction. The repair:

- reuses the shared completion-policy extractor and builder;
- displays a Heartbeat-only Stop when input;
- resets that input from the current definition whenever the dialog opens;
- enables Save when the condition changes;
- includes `completionPolicy` only when the condition changed, so unrelated
  name/prompt edits do not rewrite policy version metadata;
- maps a cleared condition to `{type: "none"}`;
- moves dirty checking and payload construction into
  `automationEdit.logic.ts` for direct testing.

Final exact-owned Native verification on bundle
`cb087679d8589bc0df34abb5026c5cf20d1c13da4dcbc97c903291784a4fd236`
rendered:

- dialog: `(240,167,420x317)`;
- panel: `(257,225,386x196)`;
- Stop when input: `(268,390,364x30)`;
- footer: `(257,435,386x32)`;
- Save: `(588,435,55x32)`.

The Native input carried both `default-value` and `value` equal to
`Original stop condition`, and the untouched Save control remained disabled.
Exact-client warning/error console was empty.

- `native-automations-heartbeat-stop-condition-edit`: P1 contribution
  `1.00 -> 0.00`.
- Focused validation: `2` files / `9` tests passed, including unchanged,
  changed, and cleared policy payloads.
- React Doctor `0.9.12` scanned the four changed Lynx source/test files against
  parent `fe17175bf` with zero errors and zero warnings. The commit hook's
  generic warning was a tool-invocation fallback, not a reported diagnostic.
- Native/Desktop production build passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Native foreground typing/save remains outside this inactive harness. The
  field/value, dirty-state, and payload contracts are verified, but this loop
  does not claim a real Native keyboard-edit roundtrip.
- Every Web authority command ran through `browser:run`; the initial
  insufficient-wait probe was classified as harness incompleteness and all
  attempts returned to `sessions: []` with zero owned browser processes.
- Canonical cleanup returned zero visible definitions/runs; the fixture
  project/thread were deleted and all isolated state/runtime/user directories
  were removed. Owned ports `58090`, `8891`, and `8901` were free.
- No screenshots were retained; local screenshot count remained `100`.

## Max iterations edit roundtrip

Active discovery moved to a policy control that can be fully certified without
Native keyboard injection: Max iterations.

Web authority had already exposed the canonical `Unlimited`, `10 runs`,
`25 runs`, `50 runs`, `100 runs`, and `250 runs` combobox in a valid populated
detail cell. The fresh fixture-specific Web probe reached only the fallback
Automations/Back surface and is classified as hydration incompleteness; it is
not counted as authority evidence or product loss.

The isolated Native fixture was a Heartbeat automation with
`maxIterations=null`, completion policy `Done`, and zero runs. A real Native
touch opened Edit. Precise inspection of the `AutomationEditDialog` subtree
confirmed that the dialog contained Name, Prompt, and Stop when, but no Max
iterations label or choices. This was a P1 capability loss: Web authority could
change the run cap while Native could only read `Unlimited` in detail.

The repair extracts the existing create-dialog choice interaction into shared
`AutomationChoiceOption`, then reuses it in both Create and Edit. Native Edit
now:

- displays the authority-aligned preset set;
- initializes the selected value from the definition;
- treats a changed cap as dirty state;
- includes `maxIterations` only when changed;
- leaves the Heartbeat completion policy untouched.

Focused tests passed `3` files / `24` tests. The new payload test proves that
selecting `10 runs` produces `maxIterations: 10` without rewriting
`completionPolicy`.

React Doctor `0.9.12` scanned the six changed Lynx source/test files against
parent `405e4ddae` with zero errors and zero warnings.

Final exact-owned production verification used bundle
`652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
Real Native touches:

- opened Edit at `(748.5,23)`;
- selected `10 runs` at `(365,415)`;
- observed `Selected` on that choice and an enabled Save control;
- touched Save at `(615.5,490)`;
- observed the dialog unmount.

Exact-client warning/error console was empty. Canonical `automation.list`
returned:

- `maxIterations=10`;
- unchanged `completionPolicy.stopWhen=Done`;
- zero runs.

- `native-automations-max-iterations-edit`: P1 contribution
  `1.00 -> 0.00`.
- This cell is a complete Native interaction/mutation roundtrip; unlike text
  editing, it is not blocked by the inactive keyboard harness.
- Every browser attempt ran inside `browser:run` and returned to
  `sessions: []` with zero agent-browser-owned processes.
- Canonical cleanup returned zero visible definitions/runs; the fixture
  project/thread and all isolated state/runtime/user directories were removed.
- Owned ports `58090` and `8891` were free. Port `8901` was occupied only by
  an unrelated `/Users/bytedance/github/t3code-archaeology-verify3` Lynxtron
  run (PID `78196`) that started after this loop's owned runtime. It was not
  terminated and is recorded as external port competition, not a Synara leak.
- No screenshots were retained; local screenshot count remained `100`.
