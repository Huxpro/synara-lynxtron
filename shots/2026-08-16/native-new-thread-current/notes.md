# Native project-scoped New Thread current-head verification

## Authority and discovered loss

The synchronized Web authority and Lynx-for-Web project-scoped draft pair is
under `shots/2026-08-14/new-thread-defaults/`. It established the shared
project presentation but explicitly left exact-owned Native unverified.

This continuation found a P1 Native reachability loss:

- Lynx routing and the Web harness accepted `/new-thread/$projectId`;
- the desktop shell did not map `synara://new-thread/<projectId>`;
- a standard Native cold start therefore fell through to `/`.

The shell now maps a non-empty, safely encoded project ID to
`/new-thread/$projectId` and rejects the empty form.

`native-new-thread-deep-link-reachability`: P1 contribution
`1.00 -> 0.00`.

## Canonical state and exact identity

The project fixture was created through negotiated canonical RPC, never by
writing SQLite:

- id: `native-fidelity-project`;
- title: `Native Fidelity`;
- workspace: `/Users/bytedance/github/synara`;
- kind: `project`;
- default model: `codex / gpt-5.6-sol`.

`orchestration.getShellSnapshot` confirmed the exact projection before launch.

Exact-owned Native:

- isolated server/Web: `127.0.0.1:58090` / `[::1]:8891`;
- temporary `@lynx-js/lynxtron@0.0.9-dev` host;
- root/app PIDs: `27952` / `27966`;
- PID-derived DevTool client: `localhost:8901`, session `1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- startup: `synara://new-thread/native-fidelity-project`;
- viewport/theme: `1280x820`, light;
- output/staged bundle SHA-256:
  `b43baab2214ae15c374e9b3470c132a85b5fb679a6f642b9462b0467ae4b443c`.

## Product evidence

The standard cold-start route rendered the project-scoped draft contract:

- header: `New thread`;
- project identity: `Native Fidelity`;
- heading: `What should we do in Native Fidelity?`;
- runtime: `Full access`;
- inherited model: `GPT-5.6 Sol`;
- project picker: `synara`.

Geometry and tokens:

- page: `(256,0,1024x820)`;
- header identity: `(276,14,87x18)`;
- body: `(256,126,1024x694)`;
- heading frame: `(400,351,736x111)`;
- heading: `(424,407,688x35)`, `30px/35px/400`;
- composer: `(400,461,736x133)`;
- tray: `(400,536,736x58)`;
- model trigger: `(975,521,116x28)`;
- project trigger: `(408,560,69x28)`;
- project label: `(435,566,35x17)`, `11px/16.5px`.

Read-only projection verification showed zero durable threads before first
send. This matches the Web draft contract: route state is not promoted to a
thread until the first successful send.

The exact-client warning/error console stayed empty. The visible provider
status still reported `codex not found in PATH`; that is isolated environment
state, not New Thread UI loss.

## Cleanup and boundaries

Both the explicit project fixture and the landing-created Home container were
removed through canonical `project.delete` commands. Final shell snapshot:

- live projects: `0`;
- threads: `0`.

Desktop DevTool has no supported Native keyboard text injection, so this cell
does not claim first-send or textarea input. Those remain missing Native
interaction coverage rather than inferred passes.

## Verification

- Focused shell/presentation/composer tests: `3` files, `19/19` passed.
- Native/Desktop production build: passed.
- Existing warnings only: unsupported encoded CSS and optional
  `bufferutil` / `utf-8-validate`.
- Output/staged hashes: identical.
- Exact-owned ports `58090`, `8891`, and `8901`: released.
- Runtime, user data, server state, and probe files: removed.
- Browser lifecycle exit gate: `sessions: []`, zero owned processes.
- Screenshot count remains `100`; no screenshot was added.

No additional P0/P1/P2 product loss was found. Remaining Native project draft
scope includes textarea/IME, first send and durable promotion, provider/model
switching, project switching, dark, compact, and `1440x900`.

## Native Desktop minimum-window continuation

The host enforces a real `900x650` minimum (`main.ts` minWidth/minHeight and
`resolveRestoredBounds`). Therefore the Web/Lynx-for-Web `390px` compact draft
is not a representable Native Desktop state. It remains an intentional platform
boundary, not missing Native evidence.

A fresh exact-owned project draft was instead certified at the real minimum:

- root: `900x650`, `SliceRoot--viewport-medium`;
- fixed sidebar: `(0,0,256x650)`;
- main/project draft: `(256,0,644x650)`;
- heading frame: `(256,266,644x111)`;
- project heading: `(280,322,596x35)`;
- composer: `(268,376,620x133)`;
- tray: `(268,451,620x58)`.

The canonical `Minimum Project` fixture inherited `GPT-5.6 Sol`; no durable
thread was created. Exact-client warning/error console stayed empty, and
canonical cleanup returned to 0 live projects.

`native-new-thread-minimum-window`: missing coverage
`1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.

Native keyboard/first-send interactions remained open after this minimum-size
cell. The `390px` compact renderer remains Web/Lynx-for-Web scope by host
design; dark/1440 is covered by the continuation below.

## Native dark 1440 continuation

A separate fresh exact-owned run added the dark `1440x900` project draft cell:

- root: `SliceRoot--theme-dark SliceRoot--viewport-wide`, exact `1440x900`;
- sidebar/main: `(0,0,256x900)` / `(256,0,1184x900)`;
- heading frame: `(480,391,736x111)`;
- project heading: `(504,447,688x35)`, `30px/35px/400`;
- composer/input surface: `(480,501,736x133)` /
  `(480,501,736x95)`;
- tray: `(480,576,736x58)`.

The canonical `Dark Project` fixture inherited `GPT-5.6 Sol`, and recursive
visible text resolved exactly to `What should we do in Dark Project?`.
Resolved dark tokens included:

- heading: `rgb(252,252,252)`;
- composer input surface: `rgb(23,23,23)`;
- tray: `rgba(252,252,252,0.00392157)`.

The production session loaded the staged file bundle from the PID-derived
`localhost:8901` client, and output/staged SHA-256 hashes were identical at
`830c5888ffd2d3312337e07de9cf249481ba97db6bed6ae6f79a488b4832c98e`.
Exact-client warning/error console stayed empty.

Canonical pre-cleanup projection contained the explicit project plus the
landing-created Home container and zero durable threads. Canonical deletion
returned to 0 live projects / 0 live threads. Owned ports, runtime, user data,
server state, and probe files were removed.

Three probe-only harness failures changed no product state: zsh and the local
legacy Bash lacked `mapfile`, and one flat text assertion did not account for
the heading's split Lynx text nodes. The retained POSIX PID probe and recursive
visible-text assertion passed against the same already-running owned process.

`native-new-thread-dark-1440`: missing coverage `1.00 -> 0.00`;
product-loss contribution remains `0.00 -> 0.00`.

The loop's final browser gate reported `sessions: []` and zero
agent-browser-owned processes. Screenshot count remained `100`.

Native keyboard/IME, first send and durable promotion, provider/model
switching, and project switching remain open.

## Native project/model switching continuation

Active discovery exercised the project picker rather than replaying the static
draft matrix. Two canonical projects intentionally used different workspaces
and default models:

- `Synara Alpha`: `/Users/bytedance/github/synara`,
  `codex / gpt-5.6-sol`;
- `Octane Beta`: `/Users/bytedance/github/octane`,
  `claudeAgent / sonnet`.

The initial exact-owned `1280x820` light draft correctly rendered Alpha:

- heading: `What should we do in Synara Alpha?`;
- project trigger: `synara`;
- model trigger: `GPT-5.6 Sol`.

A real rendered-control touch opened the shared project picker. Alpha was
selected and the Beta `octane` option was available. Touching Beta exposed a
P1 context split:

- project trigger changed to `octane`;
- model trigger changed to `Sonnet`;
- popup closed;
- heading incorrectly remained `What should we do in Synara Alpha?`.

`native-new-thread-project-presentation-split`: P1 contribution
`1.00 -> 0.00`.

The root cause was two independent project identities. `LandingComposer`
owned mutable `selectedProjectId`, while `ThreadsLandingPage` computed the
header/heading only from immutable route `initialProjectId`.

The fix lifts selected project identity into the landing host and routes every
existing-project, existing-folder, new-project, and reset transition through a
single callback. The same callback updates the Editor rail host. Editor draft
open/closed state is now independent from nullable project selection so
resetting to Home does not accidentally close the Editor draft.

The final staged bundle passed a fresh exact-owned cold-start chain:

1. Alpha: `Synara Alpha` / `synara` / `GPT-5.6 Sol`.
2. Real Beta touch: `Octane Beta` / `octane` / `Sonnet`.
3. Real `Don't work in a project` touch:
   `New Chat` / `What should we work on?` / `Work in a project`.

All transitions closed the popup and remained pre-send with zero durable
threads. Fixed Beta geometry remained:

- heading: `(424,407,688x35)`, `30px/35px/400`;
- composer: `(400,461,736x133)`;
- tray: `(400,536,736x58)`;
- model trigger: `(927,521,89x28)`;
- project trigger: `(408,560,70x28)`.

Exact-client warning/error console stayed empty. The runtime-validated
output/staged SHA-256 was identical at
`08845aa23c36575a81e758f76b9589d9bebbbab4fae69b11dabd0649f1899040`.

A final source review then added prop-to-internal project synchronization for
Editor rail project changes. Focused tests and the production build passed
again; the final output/staged bundle hash is identically
`715b648f359a1198a69647ef9b600856414c87c219d7857a97028e5a00fd4a18`.
That final prop-sync is covered by source contract plus build, not relabeled as
additional Native Editor interaction evidence.

One before-state probe selected the model chevron child instead of the menu
trigger. The corrected ancestor probe passed against the same owned process;
this was selector harness mismatch, not product loss.

Focused tests passed `3` files / `13` tests. Native/Desktop production build
passed with only the registered unsupported CSS and optional WebSocket addon
warnings. Canonical cleanup removed both projects and the landing-created Home
container, returning to 0 live projects / 0 live threads. Owned ports/runtime/
state were removed; final browser state was `sessions: []` with zero owned
processes; screenshot count remained `100`.

Native keyboard/IME and first send/durable promotion remain open. Static
provider/model inheritance plus project-driven model switching are now
covered; direct model-picker interaction remains separate missing coverage.

## Native direct model-picker continuation

A fresh exact-owned `1280x820` light project draft exercised the direct model
menu without changing project identity or sending a message.

Initial state:

- heading: `What should we do in Model Project?`;
- project trigger: `synara`;
- model trigger: `GPT-5.6 Sol`;
- durable threads: `0`.

The real model trigger opened the provider-first popup. The isolated provider
status marked Codex `Unavailable` and disabled its provider row even though the
project's active Codex model remained displayable. A first probe incorrectly
expected the popup to start on the model list; a second touch on disabled Codex
correctly produced no model rows. Both are harness/environment boundaries, not
product loss.

The same popup exposed enabled OpenCode. Real touches then completed:

1. `OpenCode` provider selection;
2. settled dynamic model catalog with seven options;
3. `DeepSeek V4 Flash Free` model selection.

After selection:

- heading remained `What should we do in Model Project?`;
- project trigger remained `synara`;
- model trigger became `DeepSeek V4 Flash Free`;
- model popup closed;
- persisted composer draft selection was
  `opencode / opencode/deepseek-v4-flash-free`;
- canonical projection still contained zero durable threads.

Exact-client warning/error console stayed empty. Output/staged bundle hashes
were identical at
`715b648f359a1198a69647ef9b600856414c87c219d7857a97028e5a00fd4a18`.
Canonical cleanup removed the explicit project and landing-created Home
container, returning to 0 live projects / 0 live threads. Owned ports/runtime/
state were removed; final browser state was `sessions: []` with zero owned
processes; screenshot count remained `100`.

## Native pre-send Plan mode continuation

A separate fresh exact-owned draft closed the remaining Plan checked-state
coverage with the precise `ComposerExtrasTriggerHostLynx` control.

Real rendered-control sequence:

1. extras host `aria-expanded: false -> true`;
2. Plan switch `aria-checked: false -> true`;
3. extras host close/reopen preserved `aria-checked: true`;
4. Plan switch returned `true -> false`.

No visible send error or exact-client warning/error appeared, and canonical
projection remained at zero durable threads. Heading/project/model/runtime
context did not change.

The first attempt toggled Plan on successfully, then accidentally clicked the
still-open host and closed the popup before looking up the switch. Its
subsequent undefined-node probe is harness operation error, not product loss.
The corrected collapsed -> open sequence completed the roundtrip against the
same product contract.

`native-new-thread-plan-mode-roundtrip`: missing coverage `1.00 -> 0.00`;
product-loss contribution remains `0.00 -> 0.00`.

Output/staged hash remained
`1dd5867a053596c75e6343cf81d170a7108977eab427bd07504bc1962688af7c`.
Canonical cleanup removed the project and Home container; owned ports/runtime/
state were removed; final browser state was `sessions: []` with zero owned
processes; screenshot count remained `100`.

`native-new-thread-direct-model-selection`: missing coverage
`1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.

Direct enabled-provider/model selection is covered. Codex-specific submenu
selection remains environment-blocked missing coverage until an exact-owned
runtime reports Codex available; it is not inferred from the OpenCode pass.

## Native pre-send permissions continuation

Active discovery exercised the permission control before first send, when the
project draft intentionally has no durable thread.

Before repair, a real `Full access -> Default permissions` touch failed:

- the trigger remained `Full access`;
- the popup closed;
- the composer showed `Unable to update permissions.`;
- exact-client console reported
  `thread.runtime-mode.set` invariant failure because the generated landing
  thread did not exist;
- canonical projection correctly remained at zero durable threads.

`native-new-thread-presend-runtime-command`: P1 contribution
`1.00 -> 0.00`.

The root cause was asymmetric pre-send handling. Landing already supplied
`onSetInteractionMode` so Plan mode stayed local until first send, but runtime
mode always dispatched a thread-scoped command.

`Composer` now accepts an optional `onSetRuntimeMode` callback before falling
back to the canonical command used by durable threads. `LandingComposer` owns
the pre-send runtime state and passes it to both the visible control and
`ensureThread`, so first send will create the thread with the selected
permission mode.

The final staged bundle passed a fresh exact-owned run:

- real `Full access -> Default permissions` touch changed the trigger;
- no visible send error appeared;
- exact-client warning/error console stayed empty;
- heading/project/model context remained unchanged;
- canonical projection stayed at zero durable threads.

Focused tests passed `3` files / `17` tests. Native/Desktop production build
passed with only the registered CSS and optional WebSocket addon warnings.
Output/staged SHA-256 was identical at
`1dd5867a053596c75e6343cf81d170a7108977eab427bd07504bc1962688af7c`.

A real Plan mode touch was issued from the extras menu and produced no product
error, but a later attempt to reopen the menu did not find the switch. That
reopen is retained as harness interaction mismatch; Plan checked-state
roundtrip remains missing coverage and is not inferred from the permission
pass.

Canonical cleanup removed the explicit project and landing-created Home
container, returning to 0 live projects / 0 live threads. Owned ports/runtime/
state were removed; final browser state was `sessions: []` with zero owned
processes; screenshot count remained `100`.
