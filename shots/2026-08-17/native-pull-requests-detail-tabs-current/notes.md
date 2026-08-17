# Current-Head Native Pull Requests Detail Tabs

## Newly certified scope

This cell consumes the restored inspector-capable Lynxtron host to certify a
Native product interaction that earlier browser evidence explicitly left open:

`populated list -> Summary detail -> Timeline -> Code -> close`

It is current-head Native evidence, not a proxy from Lynx-for-Web.

## Canonical snapshot

An ordinary project was created through
`orchestration.dispatchCommand`; SQLite was never edited:

- project ID: `native-pr-detail-project`;
- title: `Synara Pull Requests`;
- workspace: `/tmp/synara-native-pr-repo`;
- remote: `https://github.com/Emanuele-web04/synara.git`.

Before Native launch, canonical `pullRequests.list` returned:

- server instance:
  `7fd34833-6299-4080-a22b-719b97897333`;
- open entries: `50`;
- repository:
  `Emanuele-web04/synara`;
- errors: `0`;
- first live entry:
  PR `#724`, `fix: stop large-state projection repair thrash (#618)`.

Live GitHub order and titles may drift after this capture.

## Exact-owned identity

- workspace staged bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `c82671de96a9a907701b06741e3069386a8c9158b89d518fa08ed7b2ca157578`;
- isolated server state and Native user data;
- persisted outer bounds:
  `900x650`;
- PID-derived client:
  `localhost:8903`;
- session:
  `1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- root class:
  `SliceRoot SliceRoot--theme-light SliceRoot--density-comfortable SliceRoot--viewport-medium SliceRoot--viewport-sm-up SliceRoot--viewport-md-up`.

The client was selected by intersecting exact-owned PID listener ports with
DevTool clients. No remembered port, package-name assumption, or list order was
used.

## Real Native touch sequence

Every interaction used `Input.emulateTouchFromMouseEvent` with a measured DOM
box center. No DOM event dispatch or direct component-state mutation was used.

1. First populated PR row:
   `(566,189)`.
2. Timeline tab:
   `(387,70)`.
3. Code tab:
   `(454.5,70)`.
4. Close detail:
   `(878,70)`.

Results:

- list touch mounted `SharedPrDetailDock`;
- Summary was initially active;
- Timeline touch activated the Timeline tab and rendered
  `SharedPrTimelineRoot`;
- Code touch activated the Code tab;
- host RPC log contained a real `pullRequests.diff`;
- Close touch removed the detail dock and restored the list surface;
- host RPC log contained canonical
  `pullRequests.list`, `pullRequests.detail`, and `pullRequests.diff`.

The Native warning/error console was empty.

The retained temporary LynxView screenshot was JPEG `1800x1300`, the DPR 2
rendering of the `900x650` window, and was deleted after dimension validation.

## Harness exclusions

Several rejected attempts improved the DevTool driver but did not enter product
accounting:

- full `DOM.getDocument depth=-1` polling was too expensive for a populated
  50-row tree;
- `DOM.querySelector` returned `-1` for Lynx custom nodes;
- `DOM.getBoxModel` required recursive response unwrapping;
- the stream-based input helper did not terminate under this connector;
- `DOM.performSearch` also returned matching descendants, so tab containers
  were filtered by exact class token and accessibility label;
- immediate active-state reads raced the Native commit; a bounded settlement
  check replaced them;
- Code was briefly misclassified as inactive even though hit testing and the
  next DOM read showed the correct active Code node.

Every timeout, interruption, failed probe, and tool failure was followed by an
independent `bun run browser:gate` before the next browser or Native command.
All gates reported `sessions: []` and zero agent-browser-owned processes.

All exact-owned app/server process groups, ports, repository, state, and
temporary screenshot were removed. Unrelated existing DevTool clients on
`8901` and `8902` were untouched. Repository screenshot count remained `100`.

## Classification

- `native-pull-requests-populated-detail-tabs-current`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution:
  `0.00 -> 0.00`;
- no product code change was required.

This cell closes the current-head Native list/detail/Timeline/Code/close gap.
It does not certify Native keyboard search, IME, or every project/state/theme
combination.
