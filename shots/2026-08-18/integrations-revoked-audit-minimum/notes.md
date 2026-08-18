# Integrations Revoked Audit At Minimum Viewport

## Scope

- screen: Settings → Integrations;
- state: five real revoked External MCP audit rows;
- clients: Web authority, Lynx-for-Web, exact-owned Native;
- theme: dark;
- viewport: browser `900x650`, DPR `1`; Native `900x650` logical,
  `1800x1300` physical;
- server: shared isolated instance at `127.0.0.1:58090`.

The canonical snapshot contained no active integration and five revoked rows:

- `Fidelity connected UI`, previously paired and connected;
- `Fidelity connected lifecycle`, previously paired and connected;
- `Fidelity connected lifecycle`, never paired;
- `Fidelity setup parity`, never paired;
- `Coding agent`, never paired.

No fixture was written directly to SQLite. The existing audit projection was
read only.

## Web Authority

At `900x650`:

- main scroller: `644x650`;
- scroll extent: `1181`;
- all five revoked rows: `594px` wide and `124–125px` high;
- bottom scroll position: `531`;
- all five rows were reachable in one viewport after scrolling;
- `Continue setup`, `Resume pairing`, and `Revoke` actions were absent;
- page errors were empty.

## Lynx-for-Web

At the same route, snapshot, theme, viewport, and DPR:

- main scroller: `644x650`;
- scroll extent: `1167`;
- all five revoked rows: `594px` wide and `118–119px` high;
- `Continue setup`, `Resume pairing`, and `Revoke` actions were absent;
- relay had zero pending unary requests, one expected
  `terminal.subscribeEvents` stream, and no RPC or transport error;
- page errors were empty.

The `6–7px` row-height delta comes from current renderer text metrics. Content,
wrapping, separators, width, action suppression, and scroll containment were
equivalent. It is accepted renderer noise, not functional loss.

## Native Certification

The first Native capture was rejected as harness evidence because the existing
owned window was still `1280x820`. A fresh background-safe instance used the
built-in `SYNARA_VIEWPORT_PROBE_SEQUENCE=900x650` path without changing
persisted window state.

Final exact-owned identity:

- root PID `58029`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- staged bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `7b42106e7d9654721f3767a02663ae301f2a7608f6d530e89adc1086a2d09122`;
- root class included `SliceRoot--theme-dark` and
  `SliceRoot--viewport-medium`;
- root geometry: `900x650`;
- content geometry: `640x650`;
- first revoked row: `590x118`;
- physical capture: `1800x1300`;
- established product socket to `127.0.0.1:58090`;
- warning/error console: empty.

The full Native DOM contained exactly five
`SettingsIntegrationsConnection` containers and zero
`SettingsIntegrationsConnectionActions` containers. No `Continue setup`,
`Resume pairing`, or `Revoke` text was present.

## Harness Boundary

Two Native synthetic-scroll paths were attempted:

1. `DOM.scrollIntoViewIfNeeded` returned success for the final connection but
   did not move the real scroll-view.
2. `Input.emulateTouchFromMouseEvent` swipe sequences were accepted but did not
   move the real scroll-view.

This matches the existing Lynxtron DevTool input boundary tracked in
`lynx-family/lynxtron#151`. It is harness loss only. The no-op calls are not
reported as Native interaction evidence and are not attributed to product
scroll behavior.

## Classification

No new product or reliability loss was found.

The revoked audit contract is renderer-agnostic and preserved across all three
clients:

- real history remains visible;
- paired and never-paired rows share the same terminal revoked state;
- stale recovery and destructive actions are suppressed;
- the list remains in the settings content scroll owner.

Product result: pass. Coverage contribution: `1.00 -> 0.00`.

## Verification

- browser entry, failure, and exit gates returned `sessions: []` and zero
  agent-browser-owned processes;
- Web and Lynx-for-Web page errors were empty;
- exact-owned Native warning/error console was empty;
- no repository screenshot was added;
- repository screenshot count remained `100`;
- the Native app and isolated server remained running for user experience.
