# Native Pull Requests Multi-Project Filter

## Newly certified scope

This cell extends the existing single-project Native filter evidence to a
genuine two-repository snapshot:

- `Synara Project` -> `Emanuele-web04/synara`;
- `React Project` -> `facebook/react`.

Both projects were created through canonical
`orchestration.dispatchCommand`; SQLite was never edited.

## Canonical prerequisite

Before Native launch, `pullRequests.list` proved:

- server instance:
  `92866381-2aea-4092-8307-fe191a947d7c`;
- entries: `100`;
- project IDs:
  `project-react`, `project-synara`;
- repositories:
  `Emanuele-web04/synara`, `facebook/react`;
- errors: `0`.

This is materially different from the earlier Native project-filter cell,
whose only concrete option pointed at the same single repository batch.

## Exact-owned Native identity

- current staged production bundle;
- isolated `900x650` Native window and server state;
- PID-derived client:
  `localhost:8903`;
- session:
  `1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- warning/error console:
  empty;
- temporary LynxView screenshot:
  JPEG `1800x1300`, deleted after validation.

The client was selected by intersecting exact-owned PID listener ports with
DevTool clients. No remembered port, package-name guess, or client list order
was used.

## Real Native touch roundtrip

All interactions used `Input.emulateTouchFromMouseEvent` at measured DOM box
centers:

1. open the project filter:
   `(860,114)`;
2. select `React Project`:
   `(744,212)`;
3. reopen the project filter:
   `(860,114)`;
4. select `All projects`:
   `(744,178)`.

Results:

- the initial trigger represented All projects;
- selecting React changed trigger accessibility to
  `Filter pull requests by project: React Project`;
- reopening retained the React selection;
- selecting All restored
  `Filter pull requests by project: All projects`;
- the host log contained three real `pullRequests.list` calls:
  initial aggregate, React-scoped, and restored aggregate;
- no PR or pin mutation occurred.

## DevTool row-count limitation

`DOM.performSearch(.SharedPrRow)` returned both row containers and matching
descendants in this Lynx DevTool build. The raw counts were therefore `100`
after React scope and `200` after restoring All, exactly twice the canonical
50/100 container counts.

Those raw search counts are not used as product assertions. Product scope is
established by:

- canonical two-repository setup;
- trigger accessibility state;
- real menu selection and dismissal;
- three canonical list RPCs.

A follow-up exact-container counting probe was interrupted when a fresh live
dual-repository GitHub query exceeded its bounded prerequisite window. It is
classified as external-data/harness timeout, not a product failure and not a
reason to discard the retained interaction.

## Harness exclusions

- An initial script-generation attempt assumed a cleaned-up temporary harness
  still existed and failed before launch.
- The follow-up exact-container probe timed out before Native startup.
- DevTool search descendant duplication remains a named harness limitation.

Every failed script, timeout, and interruption was followed by an independent
`bun run browser:gate` before the next browser or Native command. All gates
reported `sessions: []` and zero agent-browser-owned processes.

All exact-owned app/server process groups, repositories, state, ports, and
temporary screenshot were removed. Unrelated DevTool clients on `8901` and
`8902` were untouched. Repository screenshot count remained `100`.

## Classification

- `native-pull-requests-multi-project-filter-roundtrip`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution:
  `0.00 -> 0.00`;
- DevTool descendant-count behavior:
  harness limitation;
- no product code change was required.
