# Environment Close Containment at 320x200

## Newly discovered scope

A clean standalone Changes dock was entered from the real Environment
`Changes` row at `320x200`, DPR 1, dark:

- canonical workspace:
  `/tmp/synara-standalone-diff-clean-short`;
- state directory:
  `.synara-fidelity-standalone-diff-clean-short`;
- route:
  `/thread/<thread-id>?environment=open`;
- Environment Changes target:
  `274x26 @ (27,95)`;
- interaction:
  real `agent-browser mouse move/down/up` at the measured target center;
- project/thread creation and cleanup:
  canonical `orchestration.dispatchCommand`.

The repository was a real clean Git workspace. Direct
`git.readWorkingTreeDiff` returned an empty patch.

## Product pass and P1 loss

The standalone clean Changes content itself passed:

- dock: `320x154 @ (0,46)`;
- header: `319x44 @ (1,46)`;
- body/scroller: `319x110 @ (1,90)`;
- copy: `No working tree changes.`;
- relay: `pendingRequests=0`, no transport/RPC error.

The open/close transition exposed a separate page-containment loss:

- before opening Changes:
  root/page `clientWidth=320`, `scrollWidth=320`;
- after opening Changes:
  the Environment overlay translated off-canvas to
  `x=320..632`, expanding root/page `scrollWidth` to `632`;
- after a real pointer click on `DiffDockClose`:
  the dock was gone, but root/page still had `scrollWidth=632`.

The hidden Environment transition therefore left the app horizontally
scrollable after the user closed Changes.

`lynx-environment-close-offcanvas-overflow`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

`ThreadPage` now owns `overflow: hidden`.

Environment, Explorer, and Changes are page-internal overlays. Clipping at the
page boundary preserves the existing 220ms Environment transform/opacity
animation while preventing off-canvas transition pixels from expanding the
application root. The global `.Page` contract and other routes are unchanged.

## After evidence

With a fresh Lynx-for-Web production bundle:

- before open:
  root `320/320`, page `320/320` client/scroll width;
- Changes open:
  root `320/320`;
- after real Close pointer interaction:
  root `320/320`, dock absent;
- ThreadPage still reports its internal `632px` transformed child extent, but
  computed `overflow:hidden` keeps it out of the application root;
- clean Changes geometry and copy remain unchanged;
- PNG: exactly `320x200`, SHA-256
  `ec9ab2f474a83b3d7cb7a85bc88a3acd227d1a4f47c11c1972eaed1f4ed46ef4`,
  then deleted.

The normal `1280x820` regression retained the complete Environment surface:

- overlay: `312x774 @ (968,46)`;
- surface: `288x428.5 @ (980,58)`;
- surface right edge: `1268`, inside the `1280px` root.

## Validation and boundaries

- Focused Rstest:
  `src/app/EnvironmentPanel.lynx.test.tsx`, `8/8` passed.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle`, `4565.1 kB`.
- Web bundle SHA-256:
  `1fb51acbe8907748aa718ed9442633820a4adb412dbc999114766728df60cc4b`.
- Native/Desktop production build passed:
  `dist/desktop/main.lynx.bundle`, `4272.2 kB`.
- Staged Native bundle SHA-256:
  `8ed6aea2e072ec72aa680927d0383147a82534a67139b61aed068e140817ee20`.
- Native cannot certify a `320x200` window; the build is supporting artifact
  evidence only.
- Build output contained only the registered Lynx CSS encode warnings and
  optional `bufferutil` / `utf-8-validate` warnings.
- The Environment row and Changes Close interactions used real browser mouse
  input against measured rendered targets. No DOM event dispatch was used.
- Every browser workflow ran through `bun run browser:run -- ...`; every tool
  or workdir failure was followed by the cleanup/session-list gate.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  free ports `58090` and `8891`, deleted isolated state/workspace/temp PNGs,
  and repository screenshot count `100`.
