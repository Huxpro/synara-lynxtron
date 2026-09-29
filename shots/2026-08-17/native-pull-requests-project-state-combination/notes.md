# Native Pull Requests Project and State Combination

## Newly certified scope

This cell combines Native interaction dimensions that had previously been
certified only in isolation:

`two repositories × React project scope × Open -> Merged -> Open × restore All`

The earlier Native state-filter evidence used one project. The earlier Native
multi-project evidence did not change PR state while scoped.

## Canonical snapshot

Two ordinary projects were created through
`orchestration.dispatchCommand`; SQLite was never edited:

- `Synara Project` -> `Emanuele-web04/synara`;
- `React Project` -> `facebook/react`.

Before Native launch, canonical RPCs proved:

- server instance:
  `4c825510-aaa8-4646-8acf-11bdabcb9764`;
- snapshot sequence: `2`;
- aggregate Open:
  `100` entries across both projects/repositories;
- React Open:
  `50` entries, only `project-react` / `facebook/react`;
- React Merged:
  `50` entries, only `project-react` / `facebook/react`;
- errors: `0`.

No empty or cross-repository state was used as a proxy.

## Exact-owned Native identity

- isolated `900x650` window and server state;
- current staged production bundle;
- PID-derived client:
  `localhost:8903`;
- session:
  `1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- root:
  `SliceRoot SliceRoot--theme-light SliceRoot--density-comfortable SliceRoot--viewport-medium SliceRoot--viewport-sm-up SliceRoot--viewport-md-up`;
- Native warning/error console:
  empty;
- temporary LynxView JPEG:
  `1800x1300`, deleted after validation.

The client was matched through the exact-owned process listener. No remembered
port, package-name guess, or list order was used.

## Real Native touch sequence

All interactions used `Input.emulateTouchFromMouseEvent` at measured DOM box
centers:

1. open project filter:
   `(860,114)`;
2. select React:
   `(744,212)`;
3. select Merged:
   `(636,75)`;
4. return to Open:
   `(510.5,75)`;
5. reopen project filter:
   `(860,114)`;
6. restore All projects:
   `(744,178)`.

The project popup was:

- `256x140 @ (616,130)`;
- foreground:
  `rgb(0,0,0)`;
- background:
  `rgb(255,255,255)`;
- font size:
  `14px`;
- options in product order:
  `All projects`, `React Project`, `Synara Project`.

## State and data roundtrip

Exact row-container counts and active-control assertions passed:

| Phase           | Project scope | State  | Rows |
| --------------- | ------------- | ------ | ---: |
| initial         | All           | Open   |  100 |
| scoped          | React         | Open   |   50 |
| state change    | React         | Merged |   50 |
| state restore   | React         | Open   |   50 |
| project restore | All           | Open   |  100 |

The trigger accessibility changed to React and stayed React through both state
changes, then returned to All.

Host RPC logs independently showed:

- aggregate Open;
- React Open with `projectId: project-react`;
- React Merged with both `state: merged` and `projectId: project-react`;
- restored aggregate Open.

No PR action, pin, or external GitHub mutation occurred.

## Harness exclusions

The first otherwise-complete interaction read popup geometry after the popup
had unmounted. Its stale node no longer had a box model, so that capture was
rejected as a capture-timing mismatch rather than a product loss.

Geometry was moved to the mounted-popup phase and the retained run passed.

Every failed capture and retained exit was followed by
`bun run browser:gate`; each gate reported `sessions: []` and zero
agent-browser-owned processes.

All owned app/server groups, repositories, state, ports, and temporary JPEG
were removed. Unrelated DevTool clients on `8901` and `8902` were untouched.
Repository screenshot count remained `100`.

## Classification

- `native-pull-requests-project-state-combination`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution:
  `0.00 -> 0.00`;
- stale popup box:
  harness/capture mismatch;
- no product code change was required.
