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
- Native warning/error console: zero.
- Corrected Lynx-for-Web shadow-root/relay cell: passed.
- Lynx-for-Web shared icon requests: `404 -> 200`.
- Canonical fixture cleanup: passed.
- Local screenshot count: `100`.
