# Pull Requests Multi-Project Filter at 320x200

## Canonical data identity

Two ordinary projects were created through
`orchestration.dispatchCommand`; SQLite was never edited:

- `Synara Project` -> `Emanuele-web04/synara`;
- `React Project` -> `facebook/react`.

Negotiated `pullRequests.list` independently proved:

- server instance:
  `61b9a1ff-882a-41e7-86d6-daef531b5f77`;
- snapshot sequence: `2`;
- project IDs:
  `project-synara`, `project-react`;
- entries: `100`;
- repositories:
  `Emanuele-web04/synara`, `facebook/react`;
- errors: `0`.

## Short-height all-projects state

- runtime viewport:
  `innerWidth=visualViewport.width=320`;
- runtime height:
  `innerHeight=visualViewport.height=200`;
- DPR: `1`;
- rows: `100`;
- project identities:
  `React Project`, `Synara Project`;
- popup options:
  `All projects`, `React Project`, `Synara Project`;
- popup:
  `256x140 @ (36,60)`, ending exactly at viewport bottom `200`;
- list:
  `clientHeight=scrollHeight=102`;
- PNG:
  exactly `320x200`, then deleted.

The same three-option popup measured at `y=180..320` in the existing
`320x320` cell. At `320x200`, placement moved the complete surface upward
without clipping or changing the list anatomy.

## React-scoped state

The filter trigger and the `React Project` option were activated through
measured center coordinates and real `agent-browser mouse move/down/up`
commands. No DOM event dispatch was used.

After selection:

- trigger accessibility:
  `Filter pull requests by project: React Project`;
- rows: `50`;
- every row repository:
  `facebook/react`;
- no `Emanuele-web04/synara` row remained;
- project-title metadata count: `0`, intentional because the selected project
  is already explicit in the header.

## Runtime classification

- page errors: none;
- console:
  only the known upstream deprecated initialization warning;
- `pull-requests-multi-project-filter-short-height`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution:
  `0.00 -> 0.00`;
- no product code change was required.

## Harness lifecycle

Before the retained run, rejected attempts exposed only harness defects:

- a non-executable temporary script;
- an empty readiness body and a temporary-module resolution mismatch;
- stale hand-written WebSocket capability names;
- an incorrectly wrapped raw RPC command payload;
- a light-DOM selector that did not cross the Lynx custom-element shadow root.

No rejected attempt was retained as product evidence. After every failed
script, failed probe, or tool command, `bun run browser:gate` independently
reported:

- `sessions: []`;
- zero agent-browser-owned daemon/browser processes.

The retained workflow also passed entry and exit `browser:gate` checks. All
browser commands ran inside `bun run browser:run -- ...`. The exit gate
confirmed:

- ports `58090` and `8891` free;
- isolated repositories and server state removed;
- temporary PNG removed;
- repository screenshot count remained `100`.

## Bundle identity

- Lynx-for-Web:
  `bb8ee7bd1dd27ce25f70b54844148e334042b9609cec21bfd0e35e2c3001675a`;
- Native staged:
  `5102ed2b0cfe0c689b994191d64316f41ab28e87714dcb25d59251bcbd73358c`.
