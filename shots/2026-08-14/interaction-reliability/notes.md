# Lynx-for-Web interaction reliability

## Newly discovered scope

- Surface: thread header and Explorer/Environment/model-menu fallback interactions.
- State: repeated pointer activation while the Lynx-for-Web interaction bridge is active.
- Theme and viewport: dark, `1280x820`, DPR 1.
- Snapshot: isolated server `ws://127.0.0.1:59040`, project
  `project-terminal`, thread `thread-terminal`.

## Classification

- **P1 harness/product reliability loss:** the Web-only interaction bridge used
  `globalThis.location.replace(...)` for ordinary panel, file, resize, menu,
  comment-line, and model-picker interactions.
- Each fallback activation restarted the whole Lynx renderer and changed the
  browser query string. The reload interval presented as a sudden full-screen
  interaction freeze.
- Runtime hit-testing found no persistent full-screen product overlay before
  the fix. The two product resize overlays are only mounted while their
  corresponding drag state is active.
- **Intentional platform delta:** Lynxtron continues to use memory history and
  has no browser URL. Web query parameters remain cold-start evidence fixtures
  only; runtime interaction no longer rewrites them.
- **Remaining harness gap:** the Lynx-for-Web custom-element pointer path does
  not consistently produce the Lynx `bindtap` event. The bridge now records
  those fallback activations in diagnostics instead of masking that gap with a
  page reload.

## Evidence

- Before: every bridge callback called `globalThis.location.replace`, including
  Explorer visibility/navigation/resize, Environment visibility, preview menu,
  comment line, and model menu.
- After: the interaction-host source slice contains no
  `globalThis.location.replace` or `searchParams.set`.
- Runtime baseline URL:
  `http://localhost:9301/lynx/index.html?route=%2Fthread%2Fthread-terminal`.
- Runtime `performance.timeOrigin`: `1786658367130.6` before and after three
  consecutive Files/Environment/Files pointer activations.
- Runtime URL remained byte-identical after all three activations.
- `interactionEventCount` advanced from `0` to `3`; the last classified
  fallback was `{ kind: "explorer-visibility", open: true }`.
- No fixed, pointer-active element covered at least 95% of the viewport after
  the repeated activations.

## Loss ledger

- `lynx-web-runtime-interaction-reload`: P1, product/harness integration,
  contribution `1.00 -> 0.00`.
- `lynx-web-pointer-to-bindtap`: P1 missing harness coverage, contribution
  remains `1.00`; it is now visible rather than hidden by URL reloads.
- Net tracked loss is unchanged by reclassification: the real reload loss is
  closed, while the previously masked pointer-to-`bindtap` gap is explicitly
  carried forward.

## Pointer-to-`bindtap` root-cause evidence

- A trusted browser activation reached the Files `x-view` as the complete
  `pointerdown -> mousedown -> pointerup -> mouseup -> click` sequence.
- The Web Core root `ShadowRoot` had the expected passive capture `click`
  listener. Its implementation translated DOM `click` to Lynx `tap` and called
  `wasmContext.common_event_handler(...)`.
- The clicked SVG, Files control, header, page, shell, and root all had valid
  Lynx `Symbol(uniqueId)` values, so the bubble path was complete.
- Despite those prerequisites, the Files control, Automations sidebar action,
  and other controls did not invoke their ReactLynx handlers.
- The following application-side hypotheses were tested and rejected:
  - dynamic spread `bindtap`;
  - explicit static `bindtap` with a `'background only'` handler;
  - explicit React `onClick`;
  - explicit `main-thread:bindtap`;
  - `main-thread:bindtap` followed by `runOnBackground`;
  - `lynxView.sendGlobalEvent`;
  - `lynxView.updateData`;
  - `lynxView.updateGlobalProps` plus `useGlobalPropsChanged`;
  - a coordinated trial upgrade to ReactLynx `0.123.3`,
    `react-rsbuild-plugin` `0.18.3`, and Web Core `0.24.0` with builtin
    attribute transformation enabled.
- Main-thread event trials on Web Core `0.24.0` produced repeated
  `recursive use of an object detected which would lead to unsafe aliasing in rust`
  errors and did not invoke the handler.
- The remaining fault boundary is therefore the Web Core WASM event-handler
  registration/lookup table, after DOM capture and before the ReactLynx
  callback. No local product workaround is retained because every tested
  transport either failed to deliver state or destabilized renderer startup.

## Current-head refresh (2026-08-15)

- Rebuilt and ran the repository's dedicated host-input probe against the
  currently resolved Web stack:
  - Web Core `0.23.0`
  - Web Elements `0.12.7`
  - generated product bundles currently resolve ReactLynx runtime `0.123.3`
- A real low-level browser sequence over the probe control delivered
  `mousedown`, `mouseup`, and `tap` exactly once. This disproves the older,
  over-broad interpretation that Web Core cannot publish any `tap`.
- The same low-level sequence over the real compact Editor Files control did
  not change `Changes` to `Files`; URL and `performance.timeOrigin` remained
  stable, so no reload masked the failure.
- Generated-bundle comparison isolates the difference:
  - the probe's inline handler is installed during snapshot creation through a
    static `__AddEvent(..., "tap", ...)`;
  - product handlers that close over component state or arrive through props
    compile to ReactLynx `updateEvent(...)`;
  - `updateEvent` calls `__AddEvent`, but the resulting dynamic handler ID is
    not published when Web Core dispatches the DOM click through
    `common_event_handler(...)`.
- Local remediation trials were repeated on the real Editor rail:
  - explicit `'background only'` handlers;
  - extraction into a child component;
  - direct `bindtap` inside that child;
  - `useLynxInteractiveState` spread props.
- All dynamic forms remained nonfunctional and were reverted. No one-off
  global callback registry or browser-only product mutation was retained.
- Updated classification:
  - static host-input probe delivery is a product/harness pass;
  - `lynx-web-pointer-to-bindtap` remains P1 missing fast-loop interaction
    coverage specifically for ReactLynx dynamic event registration;
  - Native `bindtap` behavior is not implicated by this Web-only result.
- Evidence:
  - `/tmp/synara-host-input-probe-current.json`
  - `/tmp/synara-bindtap-files.json`
  - `/tmp/synara-bindtap-changes.json`
  - `/tmp/synara-bindtap-experiment.diff`

## Runtime patch refinement (2026-08-15)

- The earlier “dynamic handler ID is not published” conclusion was too broad.
  Instrumented Web Core evidence showed:
  - `__AddEvent` registered complete dynamic ids such as
    `62:0:bindtap`;
  - trusted DOM clicks reached `common_event_handler` with complete bubble
    paths;
  - Web Core called main-to-background `publishEvent` with the same complete
    handler id.
- The ReactLynx background snapshot was the first confirmed loss point:
  - `updateSpread` transformed function values into handler-id strings and
    replaced the background `__values` object before background dispatch;
  - `updateEvent` similarly replaced a fixed dynamic function with its
    handler-id string even when no main-thread elements existed;
  - later `getValueBySign(handlerName)` therefore returned a string instead of
    the original callback.
- Added a pinned `@lynx-js/react@0.123.1` dependency patch:
  - background snapshots retain original functions;
  - main-thread snapshots still commit the transformed handler ids and register
    events with Web Core.
- The dedicated host-input probe now contains four independent real-click
  controls:
  - dynamic spread event;
  - dynamic fixed event;
  - dynamic component-prop event;
  - Lynx UI Button component event.
- On the freshly installed patched dependency, all four controls advanced
  from `0` to `1` through trusted browser mouse input.
- **Remaining product boundary:** the large Editor composition still did not
  commit its Files/Plus state changes even after the three minimal dynamic
  paths passed. Attempts to force a local component boundary were reverted
  because they did not close that real product interaction.
- Updated classification:
  - ReactLynx primitive dynamic-event registration/lookup: P1 product/runtime
    loss, `1.00 -> 0.00`;
  - Editor complex-composition interaction: P1 product integration residual,
    contribution `1.00`, still open;
  - browser/session leakage discovered during this investigation is a harness
    loss. The retained cleanup gate is `agent-browser close --all`, followed by
    `session list == No active sessions` and zero
    `agent-browser`/`remote-debugging-port` processes.

## Editor composition starvation closure (2026-08-15)

- **P1 product loss closed:** trusted Lynx-for-Web input now switches the real
  Editor activity rail `Changes -> Files -> Changes`.
- Root cause was not Web Core event registration, event-table GC, shadow DOM
  traversal, payload cloning, first-screen hydration, or positive snapshot IDs.
  The Composer had two Zustand selectors whose missing-draft fallback was a new
  `[]` on every snapshot read:
  - `assistantSelections ?? []`
  - `nonPersistedImageIds ?? []`
- Zustand uses `useSyncExternalStore`; a fresh reference for an unchanged store
  snapshot caused synchronous background render recursion. The Lynx background
  worker remained busy rendering and could not service the event RPC that the
  main thread had already published.
- Both selectors now use module-level stable empty arrays. A new
  post-hydration dynamic-event oracle also covers controls mounted after the
  initial screen, preventing the primitive probe from only exercising
  first-screen negative snapshot IDs.
- Quantitative attribution:
  - before: a 2-second `lynx-bg` CPU profile captured `12,897` active samples,
    dominated by ReactLynx render/profile work;
  - after: `12,706` samples included `12,616` idle samples, leaving about `90`
    non-idle samples;
  - `editor-complex-composition-interaction`: contribution `1.00 -> 0.00`.
- Retained evidence:
  - `shots/2026-08-15/editor-interaction-starvation/lynx-changes-before.png`
  - `shots/2026-08-15/editor-interaction-starvation/lynx-files-after.png`
  - `shots/2026-08-15/editor-interaction-starvation/lynx-changes-after.png`
  - `shots/2026-08-15/editor-interaction-starvation/after.json`
  - `shots/2026-08-15/editor-interaction-starvation/console.txt`
  - `shots/2026-08-15/editor-interaction-starvation/errors.txt`
  - `shots/2026-08-15/editor-interaction-starvation/cpu-before.json`
  - `shots/2026-08-15/editor-interaction-starvation/cpu-after.json`
- Evidence identity:
  - snapshot `.synara-fidelity-editor-changes`;
  - project `editor-changes-project`, thread `editor-changes-thread`;
  - route `/thread/editor-changes-thread`, Editor Changes;
  - Lynx-for-Web `1280x820`, DPR 1, dark;
  - relay `ws://127.0.0.1:58090`, one connection, no transport error;
  - all retained PNGs are exactly `1280x820`.
- Harness losses excluded from product accounting:
  - the initial static bundle contained reverted diagnostics and was rejected as
    stale;
  - one run paired a `58090` bundle with a `59260` server and was rejected for
    capture identity mismatch;
  - selector, decimal-coordinate, and CDP attachment scripting failures were
    cleaned up and not counted as product observations.

## Compact Editor interaction refresh (2026-08-15)

- Extended the closed Editor composition fix to a new compact interaction cell:
  `390x844`, DPR 1, dark.
- Trusted pointer input passed the complete activity sequence
  Changes -> Files -> Search -> Changes.
- Trusted pointer input also passed Hide chat -> Show chat. The workspace
  expanded to the full `798px` content height and restored the original
  `498.75px / 299.25px` workspace/Chat split exactly.
- `editor-complex-composition-interaction` remains closed at contribution
  `0.00`; the compact rail and Chat interaction components each add a new
  observed pass at `0.00 -> 0.00`.
- Failed selector, decimal-coordinate, stdin-forwarding, authority hydration,
  and `dev/` versus `userdata/` snapshot-identity attempts remained harness
  losses and did not enter product accounting.
- Retained evidence:
  `shots/2026-08-15/editor-compact-interactions/`.
