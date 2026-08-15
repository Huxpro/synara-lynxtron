# Populated Pull Requests interactions

## Scope and canonical data

- Newly verified state: real populated Pull Requests list, selected detail,
  Summary, Timeline, and Code tabs.
- Viewports/theme:
  - wide `1280x820`, DPR 1, dark;
  - compact `390x844`, DPR 1, dark.
- Renderer: fresh production Lynx-for-Web bundle.
- Snapshot: `.synara-fidelity-pull-requests-populated`.
- The snapshot was created through the canonical
  `orchestration.dispatchCommand` `project.create` path:
  - project `project-pr-populated`;
  - title `Synara Pull Requests`;
  - workspace `/Users/bytedance/github/synara`.
- No SQLite fixture was written. Read-only hashes identify the resulting
  snapshot:
  - `dev/state.sqlite`:
    `a209ba85773882b79b8147779c406fbb67a12dcb723ba7c4ea7ca3168e651cc8`
  - `dev/state.sqlite-wal`:
    `8f6b6e6b1c6f3d1a183472582fb6079198211a9f7c284e56508d173c3a3b61d9`
- Live `pullRequests.list` returned 50 open entries and zero repository errors.
  `Emanuele-web04/synara` reported a truthful truncated batch because the route
  caps each repository at 50 entries.
- The selected live entry was PR `#689`,
  `docs: refresh README and docs to match the website`. Live GitHub titles,
  ages, checks, comments, and list order can drift after this capture.
- Bundle identity:
  - `web-host.js`:
    `a5ca07e6fb314eb3f986cffa26911622d8937aab6b8d0fd6fcd427a1c6a6e577`
  - `main.web.bundle`:
    `3f639897cb9bb278fc7d642108597a3a8636e4a20e70b7543a4d3ad264b30733`

## Wide interaction result

Trusted low-level pointer input performed:

1. populated list -> first PR detail;
2. Summary -> Timeline;
3. Timeline -> Code;
4. Code -> Summary.

Results:

- selected list row gained `SharedPrRow--selected`;
- route body gained `SharedPrRouteBody--detail-open`;
- detail dock: `512x774` at `(768,46)`;
- list narrowed to `456px`, preserving the wide master-detail contract;
- tabs remained `28px` high and moved active state in canonical
  Summary / Timeline / Code order;
- Summary rendered real title, author, branch, `+505/-47`, reviewers,
  comments, checks, description, and actions;
- Timeline rendered real commit, opened, comment, and commit events;
- Code issued a real `pullRequests.diff` RPC and rendered `42 files`,
  `+505/-47`, and per-file rows;
- returning to Summary restored the original dock and tab state.

All four wide PNGs are exactly `1280x820`.

## Compact interaction result

Trusted pointer input opened the same real PR and switched Summary -> Timeline
-> Code.

- list scroller became `0x798`, so the compact route uses one master-detail
  surface instead of squeezing both columns;
- detail dock became `390x798` at `(0,46)`;
- the tab row ended at `x=218.8`;
- primary action ended at `x=324.4`;
- external and close actions ended at `x=353.2` and `x=382`;
- every header action remained inside the `390px` viewport;
- Summary wrapped without horizontal overflow;
- Timeline used a `350px` rail;
- Code rendered the same 42-file diff with file rows contained inside
  `x=12..378`.

All three compact PNGs are exactly `390x844`.

## Runtime gates

- Relay remained `ws://127.0.0.1:58090`, one connection, zero pending
  requests, and no transport/RPC error.
- Wide and compact `errors.json` files are empty.
- Consoles contain only the known upstream Web Core
  deprecated-initialization warning.
- The retained Code states include `pullRequests.diff` in the recent RPC tags.
- Local screenshot count after retention: 70, below the 100-image limit.

## Code disclosure and compact exit

A follow-up compact interaction cell continued from the real Code tab:

1. clicked the first `SharedPrCodeFileHeader`;
2. verified the disclosure opened with the real patch;
3. clicked the same header to collapse it;
4. clicked the real `Close pull request panel` control.

Results:

- collapsed file: `364x32` header at `(13,135)`, no disclosure body;
- expanded file: `aria-expanded=true`, a `364x180` disclosure body, and the
  real `IosSimulatorBackend.ts` hunk;
- second click removed the disclosure body again;
- close control ended at `x=382`, inside the viewport;
- after close, the detail dock was absent, route body lost
  `SharedPrRouteBody--detail-open`, and the list scroller returned to
  `390x798`;
- the first row returned at `326x50` inside the compact list;
- the follow-up page-error file is empty.

Lynx-for-Web omits the false-valued `aria-expanded` and generated accessible
label from the collapsed custom-element DOM, while the expanded state publishes
`aria-expanded=true`. Source and focused adapter tests retain the Native
`Collapsed`/`Expanded` accessibility value and `Expand`/`Collapse <path>`
label contract. This is recorded as a Web Core attribute-projection delta, not
as Native accessibility certification.

## Search and state-filter interaction

A wide follow-up cell exercised the real editable search control and state
filter:

1. focused the rendered search field;
2. typed `simulator-beta` through real keyboard input;
3. opened the single matching PR;
4. selected the rendered `Closed` pill;
5. waited for the live GitHub list request to settle.

Results:

- Open list started with 50 visible rows;
- keyboard input reduced the visible rows to one without another list RPC;
- the only match was the real
  `Support Xcode 27 beta's relocated SimulatorKit.framework` PR;
- selecting it opened the detail dock through `pullRequests.detail`;
- selecting `Closed` immediately removed the detail dock and activated the
  Closed pill;
- the settled Closed request returned 50 real rows, zero page errors,
  `pendingRequests=0`, and a final `pullRequests.list` RPC tag.

The custom-element probe does not expose a useful `.value` property for the
Lynx input wrapper. The row-count and selected-result changes establish that
the real keyboard event reached the product search state.

An intermediate Closed frame showed zero rows while the list RPC was still
pending. It was rejected as a timing sample and is not retained or counted as
an empty-state observation.

## Classification

- **Populated list/detail/tabs: product pass.**
- `lynx-pull-requests-populated-list-detail`: new component contribution
  `0.00 -> 0.00`.
- `lynx-pull-requests-summary-timeline-code-interaction`: new component
  contribution `0.00 -> 0.00`.
- `lynx-pull-requests-compact-master-detail`: new component contribution
  `0.00 -> 0.00`.
- `lynx-pull-requests-code-disclosure-interaction`: new component contribution
  `0.00 -> 0.00`.
- `lynx-pull-requests-compact-close-return`: new component contribution
  `0.00 -> 0.00`.
- `lynx-pull-requests-search-keyboard-filter`: new component contribution
  `0.00 -> 0.00`.
- `lynx-pull-requests-state-filter-detail-reset`: new component contribution
  `0.00 -> 0.00`.
- No P0/P1 product loss was found in these cells. No weighting, sample
  filtering, or scope reduction was used.
- Existing Web authority remains the visual/composition reference for the
  empty route and shared physical components. A fresh populated Web
  list/detail/tab interaction cell remains missing: the isolated Vite authority
  repeatedly failed its hydration gate under agent-browser and produced no
  valid product state to retain. No empty frame is reported as a Web pass.
- Native populated list/detail/tabs remain missing certification coverage.
  No user-owned Native process was reused or stopped.

## Harness exclusions

- Web production-static attempts are invalid for this snapshot because omitting
  `--dev-url` changes the server state directory from `dev/` to `userdata/`.
- Vite authority runs that did not pass the populated-content hydration gate
  were rejected before capture.
- A compact shell-function syntax failure happened before browser startup and
  was excluded.
- Selector and coordinate setup failures did not enter product accounting.

## Evidence

- `canonical-setup-summary.json`
- `wide/00-summary.{png,json}`
- `wide/01-timeline.{png,json}`
- `wide/02-code.{png,json}`
- `wide/03-summary-restored.{png,json}`
- `wide/errors.json`
- `wide/console.json`
- `compact/00-summary.{png,json}`
- `compact/01-timeline.{png,json}`
- `compact/02-code.{png,json}`
- `compact/00-code-collapsed.{png,json}`
- `compact/01-code-expanded.{png,json}`
- `compact/02-code-collapsed-again.{png,json}`
- `compact/03-list-restored.{png,json}`
- `compact/code-close-errors.json`
- `compact/code-close-console.json`
- `compact/errors.json`
- `compact/console.json`
- `filters/00-open-list.{png,json}`
- `filters/01-search-filtered.{png,json}`
- `filters/02-detail-open.{png,json}`
- `filters/03-closed-settled.{png,json}`
- `filters/search-errors.json`
- `filters/search-console.json`
- `filters/closed-errors.json`
