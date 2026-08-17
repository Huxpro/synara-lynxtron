# Editor Changes at 320x200

## Newly discovered scope

A canonical two-file working-tree diff was opened in the Editor Changes
surface, not the ordinary Changes dock:

- viewport: `320x200`, DPR 1;
- theme: dark;
- route flags: `editor=open&editorMode=diff`;
- workspace: `/tmp/synara-editor-diff-short-workspace`;
- canonical patch: `449` bytes containing `docs/notes.md` and
  `src/example.ts`;
- state directory: `.synara-fidelity-editor-diff-short`;
- server: `ws://127.0.0.1:58090`;
- Web/Lynx origin: `http://localhost:8891`.

The workspace was a real Git repository with committed baseline files and two
uncommitted modifications. Project and thread records were created and
deleted through `orchestration.dispatchCommand`; SQLite was not edited.

## P1 product loss

The compact Editor center had only `76px` of usable height, but Changes kept
the normal compact sidebar's fixed `176px` allocation:

- Editor center: `272x76 @ (48,46)`;
- changed-files sidebar: `272x176 @ (48,46)`, ending at `y=222`;
- diff scroller: `272x24 @ (48,222)`, entirely below the center;
- Editor body: `clientHeight=154`, `scrollHeight=200`;
- both file rows existed, but the selected patch was outside the visible
  Changes region.

`lynx-editor-diff-short-preview-offscreen`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Only short-height Editor Changes now switches to a compact horizontal
allocation:

- a `104px` full-height file sidebar;
- a `24px` sidebar header;
- `24px` file rows with compact padding;
- hidden directory suffixes in the narrow file rail;
- a `4px` diff viewport inset;
- the normal compact/medium `176px` vertical allocation remains unchanged.

This preserves both file navigation and a visible patch instead of hiding
either state.

## After evidence

The rebuilt Lynx-for-Web artifact returned `4,565,017` bytes and matched the
recorded production bundle:

- bundle SHA-256:
  `03dc59b13a0a4d856108ff19528001f61bee9a600145ac9b3f6f981611ab9742`;
- Editor center: `272x76 @ (48,46)`;
- changed-files sidebar: `104x76 @ (48,46)`;
- sidebar header: `103x24 @ (48,46)`;
- two complete file rows: `99x24 @ y=72` and `99x24 @ y=96`;
- diff scroller: `168x76 @ (152,46)`;
- Editor body: `clientHeight=154`, `scrollHeight=154`;
- renderer-ready route:
  `/thread/thread-editor-diff-short-6`;
- relay: `pendingRequests=0`, no transport error;
- PNG: exactly `320x200`, SHA-256
  `b5f5428298bc39c64a5ab17237c2ac22d32f3ef322c12546d54e14e264c46f2c`,
  then deleted.

The `1280x820` regression retained the normal Editor allocation:

- sidebar: `224x774 @ (48,46)`;
- diff scroller: `623x774 @ (272,46)`;
- PNG: exactly `1280x820`, then deleted.

## Validation and boundaries

- Focused Rstest:
  `src/app/ThreadEditorView.lynx.test.ts`, `8/8` passed.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle`, `4565.0 kB`.
- Native/Desktop production build passed:
  `dist/desktop/main.lynx.bundle`, `4272.2 kB`.
- Staged Native bundle SHA-256:
  `422bd81051502a309d8e91b409b93e69e9089c4ce20a5aa8679e9cfa087658f2`.
- Build output contained only the registered Lynx CSS encode warnings and
  optional `bufferutil` / `utf-8-validate` warnings.
- Native cannot certify a `320x200` window; the production build is supporting
  artifact evidence only.
- Web authority loaded the correct `320x200` route with no page error but
  published an empty Vite root. This is authority hydration harness loss, not
  parity evidence.
- The Lynx-for-Web accessibility tree published only the composer textbox,
  even with `snapshot -i -C`; custom diff file rows had no browser refs.
  File-switch pointer behavior remains interaction harness missing coverage.
  No DOM event dispatch was used to claim a pointer pass.
- One first after capture loaded the old Lynx-for-Web bundle and produced a
  byte-identical PNG. It was rejected as stale-bundle harness loss; the bundle
  was rebuilt before retained after evidence.
- Every browser workflow ran through `bun run browser:run -- ...`. Every
  failed selector, fixture, stale-bundle, and interaction probe was followed
  by `bun run browser:cleanup` plus a session-list check. The final gate
  reported `sessions: []` and zero agent-browser-owned processes.
- The isolated state, temporary Git workspace, and temporary PNGs were
  removed; ports `58090` and `8891` were released; the repository screenshot
  count remained `100`.
