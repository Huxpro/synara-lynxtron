# Lynx thread rename

## Newly discovered scope

- Web authority: the thread title in `ChatHeader` exposes `onRename` and opens
  the shared rename dialog.
- Lynx before:
  - `ChatSurfaceHeaderIdentity` received an optional `onRename`, but the Lynx
    title adapter discarded it.
  - Thread headers were static.
  - Sidebar context menus explicitly passed `renameAvailable: false`.
- Lynx after: both the ordinary thread header and Editor Chat rail publish the
  shared title rename action, render an inline native input, and persist the
  title with canonical `thread.meta.update`.

## Product behavior

- Empty and unchanged titles close the editor without dispatching.
- Submit and blur share one single-flight mutation path.
- Successful mutation invalidates thread detail, thread list, and sidebar
  snapshot projections.
- Errors keep the input open and render an inline error.
- The title input uses the existing native Input adapter; its initial-value
  forwarding was repaired at the shared adapter boundary so other native
  `defaultValue` consumers also receive their real initial value.
- Web and Native deterministic harnesses accept `rename=open` init data.

## Runtime evidence

- Isolated server: `ws://127.0.0.1:58090`.
- Isolated state: `.synara-fidelity-rename/dev/state.sqlite`.
- Canonical project/thread created through `orchestration.dispatchCommand`:
  - project `project-rename-fidelity`
  - thread `thread-rename-fidelity`
  - original title `Original thread title`
- Lynx-for-Web rename state:
  `?route=/thread/thread-rename-fidelity&rename=open`.
- Native input wrapper geometry: `x=276`, `y=7`, `240x32`.
- The Web custom element's real shadow input contains the current projected
  title; after mutation it contained `Renamed in Lynx`.
- Canonical rename command returned sequence `3`.
- Reloading the ordinary thread route rendered `Renamed in Lynx` twice: once
  in the sidebar row and once in the thread header.
- Retained frame:
  `lynx-for-web-rename-light-1280x820.png`, `1280x820`, non-zero RGB standard
  deviation.

## Classification

- **P1 product behavior closed:** shared `onRename` is no longer discarded by
  the Lynx adapter.
- **P1 missing coverage closed:** persisted thread titles can now be edited
  from both Lynx thread header surfaces.
- **P1 shared reliability closed:** native Input now forwards and applies its
  initial value instead of rendering an empty field.
- **Harness blocker:** agent-browser `fill` and Enter update the nested Web
  input but Web Elements do not publish the corresponding Lynx
  `bindinput`/`bindconfirm` events. UI wiring is covered by focused source
  contracts; canonical RPC and projection reload prove wire behavior. No
  rendered-control submit pass is claimed.
- **Intentional boundary:** local-only draft promotion remains Web-owned. Lynx
  does not enter a thread route before its landing composer creates the
  durable thread, so this slice correctly targets persisted threads.
- **Environment noise:** the isolated machine lacks an executable Codex CLI,
  so model discovery reports its real provider error; rename transport is
  independent and succeeded.
- **Native boundary:** the user-owned client remains on `localhost:8901`; no
  exact-owned Native rename certification is claimed.

## Loss ledger

- `lynx-header-rename-prop-dropped`: P1 product behavior,
  contribution `1.00 -> 0.00`.
- `lynx-thread-rename-missing`: P1 product parity,
  contribution `1.00 -> 0.00`.
- `lynx-native-input-initial-value`: P1 product reliability,
  contribution `1.00 -> 0.00`.
- `lynx-web-pointer-to-bindtap`: historical ReactLynx/Web Core dynamic-event
  P1 coverage, contribution `1.00 -> 0.00` globally. This rename cell still
  needs its own current-head rendered-input rerun and remains route-specific
  missing interaction coverage.
- `native-thread-rename-devtool-fixed-port`: harness blocker,
  contribution `0.00` product loss.
