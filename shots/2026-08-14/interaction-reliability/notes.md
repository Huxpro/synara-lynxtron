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
