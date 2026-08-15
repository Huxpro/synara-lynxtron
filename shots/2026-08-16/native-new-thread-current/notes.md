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
