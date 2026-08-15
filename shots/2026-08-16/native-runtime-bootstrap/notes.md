# Native runtime bootstrap and populated Kanban

## Ownership

- Server state: `/Users/bytedance/github/synara/.synara-fidelity-editor-changes`
- Owned server/Web root: PID `51066`
- Server: `127.0.0.1:58090`; Web: `127.0.0.1:8891`
- Diagnostic host: temporary published `@lynx-js/lynxtron@0.0.9-dev`
- Exact-owned launch root: PID `83303`; Lynxtron child: PID `83308`
- PID-derived DevTool client: `localhost:8901`, session `1`
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`
- Staged bundle SHA-256:
  `375e2054420309c32a8ae9116c460fcd930305f2bf22edb10fa6de37152cb950`

No pre-existing Lynxtron or DevTool listener occupied `8901..8910` before the
owned run. The published `0.0.9` host remains unsuitable for certification
because it renders without registering a DevTool client; the paired
`0.0.9-dev` package restored the diagnostic connector without changing
workspace dependencies.

## Product losses found and closed

The first exact-client startup failed before rendering the route:

1. `randomUUID()` read the undeclared `crypto` identifier while probing
   `crypto.randomUUID`, so PrimJS threw `ReferenceError: crypto is not defined`
   before the Effect fallback could run.
2. After that fix, the shared automation list module constructed two
   `Intl.DateTimeFormat` instances at module scope. PrimJS has no `Intl`, so a
   Kanban startup failed with `ReferenceError: Intl is not defined` and then
   cascaded into missing-snapshot errors.

The UUID helper now probes `globalThis.crypto` safely, and workspace IDs reuse
that single helper. Shared automation formatting now probes
`globalThis.Intl.DateTimeFormat` lazily and uses deterministic local date/time
fallbacks when it is unavailable. Focused regressions cover native Web Crypto,
missing `crypto`, workspace module initialization and creation without
`crypto`, and automation formatting without `Intl`.

After the fixes, the exact client completed renderer-ready and canonical RPC
bootstrap. Its error/warning console was empty. The retained DOM contained the
populated project board, three columns, two real cards, and both card action
triggers. The retained frame is `2560x1640` for the logical `1280x820` window.

## Interaction boundary

`Input.emulateTouchFromMouseEvent` returned success for the first card action
at its stable `DOM.getBoxModel` center `(565,205)`, but the `catchtap` handler
did not fire and the action panel did not mount. This is retained as a DevTool
interaction harness limitation, not a Native product pass or product
regression. The eight-action behavior remains covered by real Lynx-for-Web
interaction evidence; this Native cell certifies startup, populated structure,
data projection, geometry capture, and runtime cleanliness only.

The first screenshot attempt used a relative output path. Because the capture
helper changes its working directory to `apps/lynx`, the DevTool writer
rejected that path with `ENOENT`; no invalid screenshot was created. The
absolute-path retry produced the retained frame.

## Verification

- Shared automation tests: `5/5`
- Web UUID/workspace tests: `13/13`
- Explicit Native/Desktop build: passed
- Staged/output Lynx bundle hashes: identical
- Bare `typeof crypto.randomUUID` probes in staged bundle: `0`
- Exact-client warning/error console: `0`
- Local screenshot count after capture: `99`
