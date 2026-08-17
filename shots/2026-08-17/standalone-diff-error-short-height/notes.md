# Standalone Changes Error at 320x200

## Newly discovered scope

A real standalone Changes read failure was created after the Environment panel
had hydrated a valid project/thread:

- viewport: `320x200`, DPR 1;
- theme: dark;
- workspace:
  `/tmp/synara-standalone-diff-error-short`;
- state directory:
  `.synara-fidelity-standalone-diff-error-short`;
- route:
  `/thread/<thread-id>?environment=open`;
- failure:
  the hydrated workspace was removed before opening Changes;
- direct `git.readWorkingTreeDiff`:
  typed `WsRpcError`;
- entry:
  real mouse click on the measured Environment `Changes` target
  `274x26 @ (27,95)`.

Project and thread setup/cleanup used canonical
`orchestration.dispatchCommand`; SQLite was not edited.

## P1 product loss

The standalone dock body had only `110px`, while the shared state container
kept a fixed `180px` minimum:

- dock: `320x154 @ (0,46)`;
- body/scroller: `319x110 @ (1,90)`;
- state: `295x180 @ (13,102)`, ending at `y=282`;
- error text: `130.296875x18 @ y=183`, ending at `201`;
- Retry: `52.03125x28 @ y=178`, ending at `206`;
- scroller: `clientHeight=110`, `scrollHeight=204`.

The error identity and recovery action were both partially outside the
viewport.

`lynx-standalone-diff-error-short-overflow`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Only standalone DiffDock state feedback inside a short-height ThreadPage now
uses the available scroller height:

- `height: 100%`;
- `min-height: 100%`.

Normal-size state feedback keeps the existing `180px` minimum. Editor Changes
uses its separate presentation-specific short-height allocation.

## After evidence

With a fresh Lynx-for-Web production artifact:

- state: `295x86 @ (13,102)`, ending at `188`;
- error text: `130.296875x18 @ y=136`, ending at `154`;
- Retry: `52.03125x28 @ y=131`, ending at `159`;
- scroller: `clientHeight=110`, `scrollHeight=110`;
- root: `320x200`, no horizontal or vertical overflow;
- copy: `Couldn’t load changes.`;
- renderer-ready route:
  `/thread/thread-standalone-diff-error-4`;
- relay: `pendingRequests=0`, no transport error;
- PNG: exactly `320x200`, then deleted.

A real mouse click at the measured Retry center `(230,145)` increased retained
`git.readWorkingTreeDiff` RPC tags from `1` to `2`. The repeated failure stayed
local, returned pending requests to zero, and preserved the contained error
state.

## Validation and boundaries

- Focused Rstest:
  `src/app/DiffDock.lynx.test.ts`, `2/2` passed.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle`, `4565.3 kB`.
- Web bundle SHA-256:
  `912a13834e7f5fdd3d5caaa3b4b7de11e29f9d82de0344c6f367cc0057c09934`.
- Native/Desktop production build passed:
  `dist/desktop/main.lynx.bundle`, `4272.4 kB`.
- Staged Native bundle SHA-256:
  `16d0914fdf84b2e6cae67db6e275143903d7256896f6a1b67893fe10637e8831`.
- Native cannot certify a `320x200` window; the production build is supporting
  artifact evidence only.
- Build output contained only registered CSS encode warnings and optional
  `bufferutil` / `utf-8-validate` warnings.
- An initial probe navigated away from the Lynx page before reusing a stale
  target coordinate; no dock opened, so it was rejected as pointer-location
  harness failure. A subsequent global string replacement also altered the
  workspace path and was rejected before product capture.
- Every browser workflow ran through `bun run browser:run -- ...`; each failed
  probe was followed by cleanup and a session-list check.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  free ports `58090` and `8891`, removed state/workspaces/temp PNGs, and
  repository screenshot count `100`.
