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
