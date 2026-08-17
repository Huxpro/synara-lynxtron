# Pull Requests Multi-Project Filter at 320x320

## Newly discovered scope

Two canonical ordinary projects pointed at distinct real public repositories:

- `Synara Project` -> `Emanuele-web04/synara`;
- `React Project` -> `facebook/react`.

Both projects were created through `orchestration.dispatchCommand`. SQLite was
never edited.

## Canonical data identity

Before browser capture, `pullRequests.list` independently proved:

- repository batches: `2`;
- project IDs:
  `project-synara`, `project-react`;
- entries: `100`;
- each batch was a real 50-entry truncated repository result;
- errors: `0`.

Using two projects with the same repository was explicitly rejected as a
fixture strategy because the service correctly coalesces one repository into a
single batch.

## All-projects state

- rows: `100`;
- visible project identities:
  `Synara Project`, `React Project`;
- filter popup:
  `256x140 @ (36,180)`, ending at `320`;
- popup options:
  `All projects`, `React Project`, `Synara Project`;
- list:
  `clientHeight=scrollHeight=102`.

## React-scoped state

After a real pointer selection of `React Project`:

- trigger accessibility:
  `Filter pull requests by project: React Project`;
- rows: `50`;
- row repository identity:
  `facebook/react`;
- no `Emanuele-web04/synara` row remained;
- project-title meta intentionally disappeared because the scope is already
  explicit in the header.

## Return to All projects

After reopening the filter and selecting `All projects` with a real pointer:

- both `React Project` and `Synara Project` meta identities returned;
- the multi-project list was restored;
- page errors: none;
- PNG: exactly `320x320`, then deleted.

## Classification

- `pull-requests-multi-project-filter-runtime`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

## Harness notes

- The first RPC attempt raced health readiness before WebSocket upgrade
  readiness; negotiated connection preflight was added before retry.
- Three attempts reached and passed the React-scoped state but used a malformed
  inline All-projects probe. Those failures were not retained as full
  roundtrips.
- The final probe was extracted, syntax-checked, and passed as base64 before
  the retained run.
- Every failed and successful browser workflow returned to `sessions: []` with
  zero agent-browser-owned processes.
- Isolated repositories, projects, server state, ports, and temporary PNG were
  removed.
- Screenshot count remained `100`.

## Bundle identity

- Lynx-for-Web:
  `bb8ee7bd1dd27ce25f70b54844148e334042b9609cec21bfd0e35e2c3001675a`;
- Native staged:
  `5102ed2b0cfe0c689b994191d64316f41ab28e87714dcb25d59251bcbd73358c`.
