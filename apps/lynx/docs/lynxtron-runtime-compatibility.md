# Lynxtron runtime compatibility and local patches

Last updated: 2026-09-12

This document records the runtime-specific changes required to run Synara on
Lynxtron, and separates confirmed Lynxtron behavior from application bugs and
unconfirmed regression candidates. Electron remains the UI/UX authority.
Lynx-for-Web is the fast comparison renderer; only an exact-owned native
Lynxtron process counts as Desktop runtime evidence.

## Current version

Synara currently pins these packages together:

- `@lynx-js/lynxtron`: `0.0.28`
- `@lynx-js/lynxtron-builder`: `0.0.28`
- `@lynx-js/lynxtron-dev-plugins`: `0.0.28`

The lockfile resolves all three to `0.0.28`, the latest published version as of
2026-10-08. Its DevTool runtime reports Lynx SDK `4.3`. The installed macOS runtime is the
DevTool variant at:

```text
node_modules/@lynx-js/lynxtron/dist/devtool/Lynxtron.app
```

The package installs and runs the DevTool variant by default. Release and
DevTool binaries have the same npm version but live in separate
`dist/<variant>` directories.

## Did we patch Lynxtron?

No repository patch is applied to `@lynx-js/lynxtron`,
`@lynx-js/lynxtron-builder`, or `@lynx-js/lynxtron-dev-plugins`. They are trusted
dependencies so their install scripts may download the runtime, but they are
not listed under `patchedDependencies`.

There is one related vendor patch:

| Package                  | Patch                                    | Why                                                                                                                                                                                    | Lynxtron package patch?                              |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `@lynx-js/react@0.126.2` | `patches/@lynx-js%2Freact@0.126.2.patch` | Preserve spread worklet context before a snapshot has native elements and avoid registering events against an absent element tree. This prevents first-screen snapshot/event failures. | No. This patches ReactLynx runtime JS, not Lynxtron. |

Everything else below is a Synara-side compatibility layer, build hook, or
verification guard. None modifies the downloaded Lynxtron binary or framework.

## Synara-side compatibility layers

| Area                                         | Runtime behavior that required accommodation                                                                                                                                                                                                                 | Synara implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Current disposition                                                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native single-line text input                | A focused native `<input>` aborts on the first ordinary character with `NSInternalInconsistencyException: Flutter text model must not be null`.                                                                                                              | `src/components/ui/input.lynx.tsx` renders a one-line `<textarea maxlines=1>` for the crash-safe shared Input path.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Still required on 0.0.21.                                                                                                                                                                                                                      |
| Keyboard and focus delivery                  | Older Desktop runs did not publish view key events, textarea navigation keys, or Tab traversal reliably; `setFocus` completion did not prove AppKit first-responder ownership.                                                                               | Shared `.ui-focus`/interaction state, application-menu accelerators, explicit Composer/Terminal ownership handoff, and host key-monitor boundaries.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Still requires targeted 0.0.21 re-certification; generic input/edit behavior remains blocked.                                                                                                                                                  |
| Lynx-for-Web element key events              | web-core 0.26.2 listens for `keydown`/`keyup` on `document`, where the target is the `<lynx-view>` host, so element `bindkeydown`/`catchkeydown` never ran. Handlers run on a worker with a copy of the event: no methods, and no way to cancel the default. | `src/main/web/webKeyEvents.logic.ts`: the web host shows web-core the Lynx element the key was pressed in for the duration of its listener, and cancels the default synchronously from a rule table (send textarea Enter, composer menu keys, model picker Tab, overlay list keys). `components/ui/keyEvent.lynx.ts` makes the event's methods callable in the web bundle only; the Native bundle gets the handler unchanged.                                                                                                                                                                                                                                     | Retained until web-core dispatches from `composedPath()` and offers a synchronous cancel. A handler that consumes a key the browser also acts on needs a rule.                                                                                 |
| CSS interaction pseudo-classes               | Desktop supports `:active`, but the port could not rely on `:hover`, `:focus-visible`, or `:focus-within`.                                                                                                                                                   | `useLynxInteractiveState` maps pointer/focus/pressed events to `.ui-hover`, `.ui-focus`, and `.ui-pressed`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Retained until native pseudo-class support is proven.                                                                                                                                                                                          |
| Primary mouse button value                   | With `alignMouseEventWithW3C: true`, Lynxtron 0.0.12-dev reported primary `button=1`, `buttons=1` instead of W3C `button=0`.                                                                                                                                 | Sidebar resize accepts either `button===0` or the exact compatibility tuple `button===1 && buttons===1`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Retained; tracked in `plan/issues/0007-desktop-primary-mouse-button.md`.                                                                                                                                                                       |
| Transform origin                             | `transform-origin:center` and `50% 50%` rotated around the top-left path on 0.0.12-dev; `enableNewTransformOrigin` did not change it.                                                                                                                        | Disclosure affordances use separate expanded/collapsed SVG assets instead of rotating one glyph.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Retained; tracked in `plan/issues/0006-desktop-transform-origin.md`.                                                                                                                                                                           |
| Runtime CSS variables                        | Older runtime work treated dynamic custom-property mutation as unreliable. Later experiments showed `enableCSSInlineVariables` and `enableCSSRule` work on Desktop when explicitly enabled, while defaults are off/poorly documented.                        | `enableCSSInlineVariables` is on. The root view carries one inline map (`App.tsx`): upstream's theme variables for the active pack, every `color-mix()` recipe of the Native stylesheets evaluated against that pack (`appTheme.logic.ts`, same evaluator as the generator: `scripts/color-mix-eval.logic.mjs`), and the typography scale for the chosen UI font size with the `--type-*` roles resolved (`appTypography.logic.ts`). Every value in the map is concrete, because Lynx does not resolve a custom property whose value is another `var()`. The generated stylesheets hold the same names for the default pack and the default size as the fallback. | Enabled 2026-10-09; derived colours and typography moved into the map 2026-10-10, with the comparison matrix as the regression check. Remove the map entries when Lynx resolves `var()` inside custom properties and implements `color-mix()`. |
| WebSocket close lifecycle                    | The public websocket wrapper transitioned to CLOSED before close listeners could release the native socket; old runs left descriptors in `CLOSE_WAIT`.                                                                                                       | `src/platform/net.socket.ts` owns the native socket id and sends an idempotent native close; `rpcTransport.logic.ts` retires close-when-idle sockets after their final response.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Retained pending an explicit 0.0.21 FD lifecycle test.                                                                                                                                                                                         |
| Native WebSocket Origin and URL mutation     | Native WebSocket Origin was rejected by Synara's origin gate; the URL polyfill did not reliably apply `url.pathname = ...`.                                                                                                                                  | Pass trusted `synara://app` origin explicitly and build endpoints/query strings without mutable browser-URL assumptions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Retained.                                                                                                                                                                                                                                      |
| Synchronous storage contract                 | Lynx has no browser `localStorage` or page-hide lifecycle, while shared stores expect synchronous reads and ordered persistence.                                                                                                                             | Background `Map` mirror plus queued host JSON persistence; explicit hydration and flush boundaries.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Architecture boundary, not a 0.0.21 regression.                                                                                                                                                                                                |
| `--user-data-dir` isolation                  | Lynxtron 0.0.7 forwarded the argument but did not change `app.getPath('userData')`.                                                                                                                                                                          | `SYNARA_LYNX_USER_DATA_DIR`, explicit state paths, byte-exact state backup/restore, and exact-owned runtime copies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Retained until a current-version test proves the CLI flag changes the runtime path.                                                                                                                                                            |
| DevTool runtime selection                    | Older package layouts used `dist/lynxtron.app`; 0.0.21 separates `dist/devtool` and `dist/release`.                                                                                                                                                          | `verify-lynxtron-runtime.mjs` and `dev-electron-lynxtron.mjs` prefer the variant path and retain the legacy fallback.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Updated for 0.0.21; keep fallback while older supported installs exist.                                                                                                                                                                        |
| DevTool port ownership                       | Desktop DebugRouter chooses the first free port in 8901-8920. The requested comparison port is an assertion, not a runtime override. Other Lynxtron apps can take lower ports.                                                                               | Resolve the exact client from the owned PID with `lsof`; reject a launch if the owned PID did not bind the asserted port.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Required on 0.0.21. Never select by list order or remembered port.                                                                                                                                                                             |
| Exact-owned comparison app                   | Multiple apps can share the stock Lynxtron bundle identity and single-instance behavior.                                                                                                                                                                     | Copy the runtime, rewrite the bundle id/name to `com.lynxjs.SynaraComparisonLynxtron`, ad-hoc sign it, and terminate only the exact executable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Verification-only harness, required for safe evidence. Re-signing intentionally changes the executable hash.                                                                                                                                   |
| macOS packaging helper                       | Lynxtron 0.0.7 omitted `Lynxtron Helper.app`, while electron-builder 26.8.1 unconditionally tried to rename it.                                                                                                                                              | `scripts/lynxtron-macos-helper-hook.mjs` creates a marker-owned placeholder after extraction and removes only that placeholder after pack.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Legacy builder workaround; re-test the packaged 0.0.21 app before deleting it.                                                                                                                                                                 |
| Production DevTool enablement                | A release build could register a connector without creating an inspectable session.                                                                                                                                                                          | Enable DevTool before window creation only in development or with `SYNARA_ENABLE_DEVTOOL=1`; verify executable, PID, listener and session URL.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 0.0.21's default DevTool runtime improves this, but the explicit product gate remains useful.                                                                                                                                                  |
| Native SVG color variables                   | CSS variables inside raw SVG strings are not a reliable paint authority.                                                                                                                                                                                     | Resolve semantic icon roles to concrete theme colors before assigning SVG `content`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Still used and verified on 0.0.21.                                                                                                                                                                                                             |
| Main/background dependency graph             | Broad Web imports, module-level `background-only`, lazy `file:` chunks, keyed Fragment wrappers, and some render-time expressions can compile but fail template-context construction or first paint.                                                         | Keep portable logic in narrow shared leaves, use eager imports only inside background handlers, avoid artificial list wrappers, and require compile/module-load/paint/interaction gates.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | ReactLynx/compiler boundary; not attributed solely to Lynxtron.                                                                                                                                                                                |
| Zero BigInt constants in main-thread code    | Lynxtron 0.0.28 rejects main-thread bytecode that holds a zero BigInt constant (`0n`) with `Decode error: Context construct failed`; non-zero BigInt constants load. Rspack 2.2 keeps an unused Effect Schema expression containing `0n`.                    | `scripts/zero-bigint-literal-loader.mjs` runs as a post loader on the `react:main-thread` layer and rewrites zero BigInt literals to `globalThis.BigInt(0)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Lynxtron main-thread engine; exposed by the Rspeedy 0.18 / Rspack 2.2 upgrade.                                                                                                                                                                 |
| Native visual material                       | Lynxtron does not expose Electron/macOS vibrancy behind the sidebar.                                                                                                                                                                                         | Project the shared opaque card surface as the Native visual equivalent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Intentional platform adaptation.                                                                                                                                                                                                               |
| Missing updater/global shortcut/session APIs | Lynxtron does not expose every Electron host API needed by Synara.                                                                                                                                                                                           | Host ports, app-menu accelerators, metadata-only update checks, fixed download page, and explicit unsupported UI copy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Intentional product architecture boundary.                                                                                                                                                                                                     |

## Version history relevant to Synara

| Version      | Observed role in this repository                                                                                                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0.0.7`      | Initial port and most early platform probes: input, keyboard/focus, AX, storage isolation, DevTool, sockets, CSS and packaging.                                                                                                                                                                |
| `0.0.9`      | Upgraded runtime/builder/dev plugins together while resolving the Native template-context startup blocker. A known-good reduced dependency graph painted successfully on the same host, confirming that the immediate blocker was the imported module graph rather than package version alone. |
| `0.0.12-dev` | Used for CSS flag, transform-origin and primary-mouse-button experiments; the main runtime was ahead of the still-0.0.9 builder/dev plugins during that period.                                                                                                                                |
| `0.0.16`     | Used by later fidelity and physical-input work. Generic single-line input crash and several Desktop input/AX limitations were still present.                                                                                                                                                   |
| `0.0.21`     | Introduced synchronized variant-aware runtime installation and restored inspectable Native sessions. Historical evidence below was collected on this version.                                                                                                                                  |
| `0.0.22`     | Current synchronized runtime, builder and dev-plugin version. Upgrade all three together and re-certify the retained 0.0.21 workarounds before removing any of them.                                                                                                                           |

## 0.0.22 upgrade verification

- npm resolves runtime, builder, and development plugins to `0.0.22` with the
  registry-published integrity values recorded in `bun.lock`.
- A fresh download of the official
  `lynxtron-v0.0.22-darwin-arm64-devtool.zip` matched the installed runtime
  byte-for-byte: executable SHA-256
  `dccabe3471bf0343cce4e241d8dde4abb090d44984c590c2904f6b5241d00aea`
  and Framework SHA-256
  `3709ffdcf94815569e577dde7de79148fc1a4d1470049d9b02d6510d2373f0b0`.
- The exact-owned comparison process PID `3233` loaded the rebuilt
  `apps/lynx/dist/desktop` bundle. Its copied app reports both source and bundle
  version `0.0.22`; its Framework `__TEXT,__text` bytes match the installed
  official 0.0.22 runtime, and its PID-derived DevTool console is clean.
- The complete Lynx production build, runtime verifier (6/6), and focused
  Environment contract suite (8/8) pass. Existing compatibility layers remain
  until their behavior is independently re-certified on 0.0.22.

## ReactLynx toolchain upgrade (2026-10-08)

Lynxtron stayed at `0.0.28`. The ReactLynx build toolchain moved to
`@lynx-js/react` 0.126.2 (Preact 11), `@lynx-js/rspeedy` 0.18.0 (Rsbuild 2.2.9,
Rspack 2.2.8), `@lynx-js/react-rsbuild-plugin` 0.20.3, `@lynx-js/types` 4.3.0
and `@lynx-js/web-core` 0.26.2.

- The ReactLynx vendor patch is still required. It was regenerated against
  0.126.2: Bun applies hunks at their recorded line numbers, so the 0.123.1
  patch corrupted `spread.js` instead of failing.
- The first build did not load: see the zero BigInt row above.
- On the rebuilt bundle the comparison launcher certifies both renderers on the
  fixture thread, the paired cell matrix passes 24/24 base cells and 28/28
  state increments, and workflows J3–J6 pass in both renderers. The Lynx test
  suite fails the same tests as before the upgrade. Details are in
  [`plan/reports/toolchain-upgrade-2026-10-08.md`](../plan/reports/toolchain-upgrade-2026-10-08.md).

## What 0.0.21 improved

These are confirmed in the current workspace:

1. **DevTool-capable runtime is installed by default.** The package downloads
   `dist/devtool/Lynxtron.app`, and exact-owned runs expose a PID-derived client
   and a `file:///.../dist/desktop/main.lynx.bundle` session. This restored DOM,
   box-model, computed-style and raw-SVG inspection that was unavailable with a
   release-only runtime.
2. **Release and DevTool variants are explicit and isolated.** The package can
   fetch or select `release` separately without conflating it with the default
   DevTool artifact.
3. **Current fidelity inspection is materially stronger.** 0.0.21 enabled
   direct verification of Markdown/Diff fonts, semantic SVG strokes, input
   geometry, Plugin Library geometry and context-window card box models. This
   is an observability improvement; it does not by itself imply rendering or
   interaction fixes.

## 0.0.21 unchanged blockers

The following were reproduced after the synchronized 0.0.21 upgrade. They are
not new 0.0.21 regressions; the upgrade simply did not fix them.

| Blocker                                     | Current evidence                                                                                                                                                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single-line `<input>` crash                 | Exact-owned Add Action input aborted with `NSInternalInconsistencyException: Flutter text model must not be null`. Keep the one-line textarea workaround.                                                               |
| macOS accessibility tree                    | The exact-owned app still exposes only application/window/root group/traffic-light controls even while DevTool exposes the complete Lynx DOM. App accessibility attributes are present, but Desktop AX bridging is not. |
| Async background-to-foreground query commit | Host RPCs complete quickly, but Sidebar/Thread observers can remain at `Loading projects...` / `Loading conversation...`. A real two-message project thread still produced zero matching Native rows. This is FC-039.   |
| `App.openPage` Desktop navigation           | The App command returns `not implemented`; Native route changes must continue through the product shell/deep-link/global-event path.                                                                                    |
| DevTool port determinism                    | The runtime still binds the first free port in 8901-8920 instead of honoring a requested fixed port. Harnesses must derive ownership from PID.                                                                          |
| Generic AppKit edit commands                | Non-Composer text controls still do not have verified Undo/Redo/Cut/Copy/Paste/Select All parity through the Native first responder.                                                                                    |

## 0.0.21 regression candidates and upgrade findings

These observations occurred on 0.0.21, but are **not yet proven to be caused by
the version upgrade**. They must not be reported upstream as confirmed runtime
regressions without the A/B evidence described below.

### Resolved Synara regression: background `svgColors` free variable

On 2026-09-10, a fresh production comparison launch for
`composer/model-effort-picker`, `variant=thread`, `state=overflow` produced five
background-runtime errors:

```text
unhandled rejection: svgColors is not defined
ReferenceError: svgColors is not defined
    at file://shared/lynx_core.js:5082:18
```

The window fell back to Settings and displayed the LogBox banner rather than
the requested Components Lab route. The exact-owned process was PID `44701`,
its listener was `localhost:8902`, and the build used the current 0.0.21
DevTool runtime. Bundle inspection mapped the failure to two nested Sidebar
renderers that used `svgColors.iconSecondary` even though the owning `Sidebar`
component had no `svgColors` binding. The production bundle consequently
contained two literal free-variable expressions.

The fix resolves one concrete secondary semantic icon color in the `Sidebar`
root and passes it to the thread-pin and project-terminal raw SVG calls. A
focused sidebar suite passes 5/5, the complete Native/Desktop production build
passes, and the rebuilt bundle contains neither old free-variable expression.
A fresh exact-owned 0.0.21 run at PID `77644`, client `localhost:8902`, then
rendered the requested overflow route and returned an empty error/warning
console.

Classification: **fixed Synara-side regression exposed by the 0.0.21
LogBox/inspector, not a Lynxtron 0.0.21 regression.**

### Installation override conflict

The first `bun install` with builder 0.0.21 failed because its npm postinstall
encountered an `EOVERRIDE`: the root directly depended on `postcss@^8.5.19` but
overrode PostCSS to `^8.5.10`. Aligning the root override to `^8.5.19` made the
install succeed. This is a package-manager/integration compatibility change,
not a runtime behavior regression.

## Known non-regressions and evidence traps

- A 70x32 Electron compact model trigger versus 66x28 Native was caused by the
  Electron authority rendering inside a 467px iframe (`sm=false`) while Native
  rendered at the real 1280px product viewport. The visible anatomy matches; do
  not add a Native 32px compact override for this comparison-only delta.
- A DevTool screenshot timeout from a hidden/unpainted window does not prove a
  white-screen product crash. Confirm the exact window and process first.
- A DevTool port mismatch is a harness failure. Other Lynxtron apps may own
  8901/8902; always resolve the client from the owned PID.
- `SYNARA_ENABLE_DEVTOOL=1` cannot turn a release-only binary into a DevTool
  runtime. Verify the selected runtime variant and inspector resources.
- The template-context startup failure resolved during the 0.0.7 to 0.0.9 work
  was caused by an oversized/incompatible Web dependency graph crossing into
  ReactLynx, not demonstrated as a Lynxtron package regression.
- Browser/Lynx-for-Web and Native evidence are different tiers. A pass in the
  `/lynx/` iframe does not certify Native input, focus, AX, window, menu,
  persistence, gesture or host integration behavior.
- A Components Lab Space Project Picker that remained on `Moving…` after a
  successful submit was a controlled-story bug, not a runtime regression. The
  real dialog expects its owner to commit `onOpenChange(false)`; a permanently
  true `open` prop prevents the successful submit path from unmounting.

## Removal policy

Do not remove a workaround solely because the package version changed. For each
candidate removal:

1. identify the smallest exact-owned Native reproduction;
2. build and stage the complete production bundle;
3. verify executable, PID, DevTool listener and session URL;
4. exercise the real product path, not only a unit test or synthetic state;
5. check the exact-client error/warning console;
6. retain a focused regression test before deleting the workaround.

## Primary evidence and code pointers

- Package pins: `apps/lynx/package.json`, `bun.lock`
- Vendor patches: root `package.json`, `patches/`
- Runtime verifier: `apps/lynx/scripts/verify-lynxtron-runtime.mjs`
- Exact-owned launcher: `scripts/dev-electron-lynxtron.mjs`
- Packaging shim: `apps/lynx/scripts/lynxtron-macos-helper-hook.mjs`
- Input workaround: `apps/lynx/src/components/ui/input.lynx.tsx`
- Socket lifecycle: `apps/lynx/src/platform/net.socket.ts`,
  `apps/lynx/src/data/rpcTransport.logic.ts`
- Runtime/platform patterns: `apps/lynx/plan/04-lynx-patterns.md`
- Current fidelity ledger:
  `apps/lynx/plan/reports/fidelity-continuation-backlog-2026-09-06.md`
- Upstream-ready reports: `apps/lynx/plan/issues/0001-*` through `0007-*`
