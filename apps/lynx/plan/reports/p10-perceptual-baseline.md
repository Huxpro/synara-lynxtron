# P10 perceptual fidelity baseline

Status: Phase 0 complete; Phase 1 typography calibration in progress

Updated: 2026-08-04

## Scope

This baseline establishes the P10 evidence contract and the first current-build
canonical Browser states:

- New Chat landing;
- Sidebar project navigation;
- default Composer.

All six canonical Browser pairs are retained. Every required Native cell
remains explicitly incomplete. Typography details for Settings, Project Picker,
and the filtered skill menu are in `p10-typography-calibration.md`.

## Harness

- Shared browser origin: `http://localhost:9933`
  - Web original: `/`
  - Lynx-for-Web: `/lynx/index.html`
- Shared server: `ws://127.0.0.1:59132`
- Isolated state: `.synara-p10`
- Read-only online-backup snapshot SHA-256:
  `ad4295f695424da64b6fcdb8a3a7c68ed4d766b91bf79069e87ceecbb0d82666`
- Snapshot product rows were created through canonical
  `orchestration.dispatchCommand`, never by writing SQLite:
  - project `P10 Fidelity Workspace`;
  - thread `Perceptual fidelity baseline`.
- Browser viewport: `1280×820`, DPR 1, light, comfortable density.
- Normalized comparison viewport: `1280×788`.

Two discarded harness attempts are not product evidence:

1. separate Web/Lynx origins were correctly rejected by the server origin
   policy;
2. Vite `/@fs/` serving transformed the built Lynx worker and stalled storage
   hydration.

The retained harness stages the Lynx Web build under the same trusted Vite
origin before startup, matching the previously validated `/lynx/` topology.

## Residual Atlas

Added:

- `apps/lynx/scripts/perceptual-evidence.mjs`;
- `apps/lynx/scripts/perceptual-evidence.test.mjs`;
- `shots/2026-08-04/p10-perceptual-fidelity/manifest.json`;
- generated `manifest.js`;
- independent `comparison.html`.

The verifier requires:

- exact state identity;
- three-client evidence entries;
- raw and normalized PNG dimensions;
- build/snapshot identity;
- geometry, resolved styles, and console artifacts;
- residual category/severity/owner/disposition;
- evidence for accepted noise and intentional deltas;
- zero open P0/P1 residuals in strict mode.

The comparison supports:

- raw Web/Lynx/Native columns;
- any retained client pair as overlay inputs;
- alpha overlay;
- draggable split;
- embedded geometry/resolved-style inspection;
- residual severity and disposition filters.

## Baseline findings

### Fixed in this slice

1. **Lynx-for-Web outer shell inset**
   - Root cause: browser default `body { margin: 8px }`.
   - Before: Sidebar, landing hero, Composer, and every child rail were `+8px`
     in both axes.
   - Fix: Web-host-only document/body reset in `web-host.ts`.
   - Native product anatomy was not changed.

2. **Landing/header rail**
   - Root cause: the Lynx header adapter retained an additional 8px left
     margin after shared header convergence.
   - After: hero X exact, Composer X exact, header X exact.
   - Remaining Y deltas: hero `0.25px`, Composer `0.75px`, header `1.5px`.

3. **Sidebar Projects section geometry**
   - Before: project header `x +4px`, `y +17.75px`, width `-9px`.
   - Root causes:
     - obsolete 14px primary-navigation bottom margin;
     - Lynx section root used 10px horizontal padding instead of Web's 6px.
   - After: header X exact, Y `0.25px`, width `-1px`.

4. **Sidebar project-label typography**
   - Before: same 12px/400 face, but Lynx visual line box was 15px versus
     Web 18px; label X was `-3px`.
   - Fix: canonical 18px line height plus Web-equivalent icon/copy gap.
   - After: label X exact, Y `0.25px`, height exact.

5. **Misleading project thread count**
   - Lynx rendered `1` on every project header while Web uses trailing
     project-run/collapsed-thread status semantics.
   - The count was deleted. Lynx retains real collapsed project status only.
   - Web local-server/project-run state is recorded as an intentional platform
     delta until that projection is shared; no status is fabricated.

### Positive findings

- Hero typography already matched:
  `30px / 400 / -0.45px`, width `320.359px`.
- Composer surface dimensions already matched exactly:
  `736×95`, radius `19.2px`.
- Composer light material was already effectively identical:
  matching translucent white surface, 1px border, and
  `0 4px 18px -6px` 7% shadow.
- Web and Lynx Browser page-error files are empty.

## Native boundary

An exact-owned isolated Native instance was launched with:

- bundle SHA-256:
  `a15c45a5071202f61f88ec4aa9034c040f51529d3a071474c178406c3e670ffc`
  for the initial diagnostic build;
- PID-derived `localhost:8904/session 1`;
- `1280×820` outer bounds;
- `2560×1576` DevTool frame;
- isolated `/tmp/synara-p10-native-state`.

The frame is retained only as `diagnostic`: DevTool disconnected before route
and geometry artifacts could be revalidated. The three Native required cells
therefore remain red. No user state was touched.

## Current strict status

- 6 canonical states.
- 3 incomplete required client cells, all Native overlays/Settings.
- 0 open P0/P1 residuals in measured Browser states.
- Strict verifier exits `2` as designed.

## Next

1. Typography role contract across transcript, route titles, buttons, and chips.
2. Dark/two-size Browser expansion for calibrated roles.
3. Use the PID-gated atomic Native helper to replace the diagnostic frames with
   six exact-state retained Native cells.

## Native capture helper

`scripts/native-perceptual-capture.mjs` now performs one fail-closed capture
transaction:

1. walks the supplied launch-root PID tree;
2. derives its listening ports with `lsof`;
3. requires exactly one matching DevTool client and its latest Lynx session;
4. captures the LynxView frame first;
5. fetches the complete DOM, required role boxes, and computed styles strictly
   serially on one connector;
6. collects only warning/error console messages;
7. writes identity and state echo metadata only after every required step
   succeeds and the launch root is still alive.

The first E2E diagnostic used isolated server `60242`, isolated user data,
launch root `77749`, app PID `77750`, and PID-derived
`localhost:8904/session 1`. It produced:

- `2560×1576` PNG;
- full DOM;
- four required role geometry/style entries;
- empty warning/error console;
- PID/client/session/build/snapshot/state identity.

The first implementation exposed two harness defects that are now locked down:
parallel box/style CDP calls reset the single-client connection, and waiting
for the screencast stream to end timed out after the first frame. The helper now
uses serial CDP and the same first-frame/ACK flow as the official CLI. Failed
attempts wrote no retained metadata. The diagnostic is not a required manifest
cell because its route was intentionally offline; it proves the harness only.

## Canonical six-state Native close-out

The six Phase 0 canonical states now have like-for-like Web, Lynx-for-Web, and
exact-owned Native evidence. The last cell was the filtered `$review-agent`
skill menu.

That close-out exposed one real Native interaction defect. Programmatic
`setValue` emits a later `bindinput` ACK. The ACK handler always cleared
`composerTrigger`, even when the caller had intentionally derived and opened a
skill trigger after Native paste, cut, undo, or redo. The Native value
transaction now carries an explicit `triggerAfterAck` disposition. Matching
ACKs restore that disposition; token selection, send, clear, and other close
paths still use `null`.

The retained filtered state was created through the real Native input boundary:

1. activate only the exact-owned PID long enough to make it the macOS text
   client;
2. click the visible textarea at its audited screen coordinates;
3. invoke the existing host Edit path (`select-all`, `cut`, and
   `composer:paste-text`);
4. warm provider skill discovery before freezing the owned server;
5. capture with the PID-gated atomic helper.

The final frozen transaction used snapshot
`c3703ba8e9429344f70ab0d984afcfa608635876a0cda6e945931d5376d6b3a4`.
Before and after online backups matched. All clients retained the exact query
and result order:

1. `review-agent`;
2. `review-bugbot`;
3. `review-security`;
4. `review`.

The first row is active. Native retained nine required roles, a `2560×1576`
frame, PID-derived `localhost:8904/session 1`, and an empty warning/error
console. Browser frames are `1280×820`; all normalized comparison frames are
`1280×788`.

The strict atlas currently reports **6 states / 0 incomplete cells / 0 blocking
residuals**. This closes only the Phase 0 canonical baseline. It does **not**
certify the P10 final route × theme × size × state matrix, motion sequences, or
golden-control state coverage.
