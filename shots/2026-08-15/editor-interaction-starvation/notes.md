# Editor interaction starvation

## Scope and identity

- Newly verified interaction: wide Editor activity rail switching between
  Changes and Files while the full Chat/Composer rail remains mounted.
- Snapshot: `.synara-fidelity-editor-changes`.
- Project/thread: `editor-changes-project` / `editor-changes-thread`.
- Route/state: `/thread/editor-changes-thread`, `editor=open`,
  `editorMode=diff`.
- Renderer: fresh production Lynx-for-Web bundle.
- Viewport/theme: `1280x820`, DPR 1, dark.
- Relay: `ws://127.0.0.1:58090`.

## Classification

- **P1 product performance and interaction loss, closed.**
- Two missing-draft Zustand selectors returned fresh arrays from
  `useSyncExternalStore` snapshot reads. The resulting synchronous render
  recursion starved the Lynx background worker, so the main-thread `tap`
  publication could not reach its ReactLynx callback.
- Stable module-level empty arrays restore snapshot referential stability.
- `editor-complex-composition-interaction`: contribution `1.00 -> 0.00`.
- A post-hydration probe control extends coverage beyond first-screen controls.

## Behavior and performance evidence

- Trusted pointer sequence:
  - Changes -> Files: pass.
  - Files -> Changes: pass.
- PNG dimensions:
  - `lynx-changes-before.png`: `1280x820`.
  - `lynx-files-after.png`: `1280x820`.
  - `lynx-changes-after.png`: `1280x820`.
- `errors.txt` is empty.
- Relay diagnostics retained the isolated machine's expected
  `codex not found in PATH` provider-model discovery failure; transport stayed
  connected and the Editor interaction did not depend on that provider query.
- Before-fix `cpu-before.json`: `12,897` active samples over about two seconds.
- After-fix `cpu-after.json`: `12,706` total samples, of which `12,616` are
  idle.

## Harness exclusions

- A stale bundle containing reverted diagnostics was rejected.
- A `58090` bundle paired with a `59260` server was rejected as an identity
  mismatch.
- Failed selector, coordinate, and CDP scripts were harness failures and did
  not enter product loss accounting.
