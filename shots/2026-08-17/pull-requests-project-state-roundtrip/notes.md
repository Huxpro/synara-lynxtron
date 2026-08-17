# Pull Requests Project Scope Across State Roundtrip

## Newly discovered scope

This cell combines interaction dimensions that were not covered together by
the existing Pull Requests evidence:

`multi-project snapshot × React project scope × Open -> Merged -> Open × dark × 320x320`

The prior multi-project cells proved project selection only in Open. Historical
state evidence proved state changes only outside this two-repository scoped
composition.

## Shared snapshot and capture identity

Two ordinary projects were created through
`orchestration.dispatchCommand`; SQLite was never edited:

- `Synara Project` -> `Emanuele-web04/synara`;
- `React Project` -> `facebook/react`.

The retained run used:

- server instance:
  `f095e3fd-ad0c-45f7-8921-5bfec2f3b4af`;
- snapshot sequence after project creation: `2`;
- shared origin: `http://localhost:8891`;
- Web original route:
  `/pull-requests?involvement=all&state=open`;
- Lynx-for-Web route:
  `/lynx/index.html?route=%2Fpull-requests`;
- separate named browser sessions;
- dark theme;
- viewport and visual viewport:
  `320x320`, DPR `1`;
- temporary Web and Lynx PNGs:
  both exactly `320x320`, deleted after validation.

The negotiated connection preflight resolved Web, Lynx-for-Web, and the Native
protocol probe to one server instance before any product interaction.

## Canonical state prerequisite

Before opening a browser, `pullRequests.list` proved that the selected React
project had real data in both transition states:

| State | Entries | Repository batches | Repository | Errors |
|---|---:|---:|---|---:|
| Open | 50 | 1 | `facebook/react` | 0 |
| Merged | 50 | 1 | `facebook/react` | 0 |

Both repository batches were genuinely truncated at the 50-entry limit.
`Closed` was rejected as the target state because its current canonical React
result was empty; that prerequisite mismatch was not hidden or retained as a
behavior sample.

## Real interaction roundtrip

Both clients used measured element centers followed by real
`agent-browser mouse move/down/up` commands. No DOM event dispatch was used.

The sequence was:

1. start at All projects + Open with 100 rows;
2. open the project filter;
3. select `React Project`;
4. verify 50 `facebook/react` rows;
5. activate `Merged`;
6. verify React scope and 50 merged rows;
7. activate `Open`;
8. verify React scope and 50 open rows.

### Merged state

Both clients retained:

- trigger accessibility:
  `Filter pull requests by project: React Project`;
- active Merged state:
  `aria-pressed=true`;
- rows: `50`;
- repository identity:
  only `facebook/react`;
- no `Emanuele-web04/synara` row.

Web additionally encoded the product state in its canonical URL:

`?involvement=all&state=merged&projectId=project-react`

Lynx retained the same product state in its route component state and query
key, as designed.

### Return to Open

Both clients again rendered 50 `facebook/react` rows and retained the React
project trigger label. Web returned to:

`?involvement=all&state=open&projectId=project-react`

## Geometry and styles

At Merged:

| Metric | Web original | Lynx-for-Web |
|---|---:|---:|
| Filter shell | `280x104 @ (20,62)` | `264x102 @ (28,108)` |
| Foreground | `rgb(252, 252, 252)` | `rgb(252, 252, 252)` |
| Shell background | transparent | transparent |
| Root theme | `html.dark` | `SliceRoot--theme-dark` |

The `46px` vertical offset is the registered compact Lynx titlebar correction:
Lynx-for-Web exercises the Native compact header allocation while Web original
does not reserve that host titlebar. It is an intentional platform delta, not
a product loss. Both filter shells remain contained and fully operable.

## Console attribution

An earlier successful behavior run accumulated a TanStack Router
`_nonReactive` TypeError in its long-lived Web development console. It was not
accepted without attribution.

A fresh paired run split and cleared Web console evidence after:

1. initial Open hydration;
2. React project selection;
3. Merged transition;
4. return to Open.

The error did not recur. Final Web page errors and console were empty. Lynx
reported only the named upstream deprecated initialization warning. The
non-reproducible earlier entry is classified as development-session noise, not
product reliability loss.

## Classification

- `pull-requests-project-state-roundtrip`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution:
  `0.00 -> 0.00`;
- compact titlebar geometry:
  intentional platform delta;
- Native runtime interaction:
  remains harness missing coverage because the current exact-owned host still
  does not register a PID-derived DevTool client;
- no product code change was required.

## Verification

- Web focused tests:
  `2 files / 10 tests` passed;
- Lynx focused tests:
  `3 files / 16 tests` passed;
- Web production build:
  passed, `8,953` modules;
- Lynx-for-Web production build:
  passed;
- Native/Desktop production build and staging:
  passed;
- Lynx-for-Web bundle:
  `bb8ee7bd1dd27ce25f70b54844148e334042b9609cec21bfd0e35e2c3001675a`;
- Native source/staged bundle:
  `5102ed2b0cfe0c689b994191d64316f41ab28e87714dcb25d59251bcbd73358c`.

## Harness lifecycle

Rejected harness attempts included:

- the live React Closed query returning no canonical rows;
- an over-broad six-query discovery probe interrupted after excessive latency;
- escaped CSS selector text;
- multiline/base64 JavaScript transport issues.

Every timeout, interruption, failed script, failed probe, and tool failure was
followed by an independent `bun run browser:gate` before any next browser
command. Each gate reported:

- `sessions: []`;
- zero agent-browser-owned daemon/browser processes.

The retained workflow and its exit gate also removed both projects, isolated
state, temporary PNGs, and released ports `58090` and `8891`. Repository
screenshot count remained `100`.
