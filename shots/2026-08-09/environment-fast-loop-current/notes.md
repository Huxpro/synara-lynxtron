# Environment fast-loop current-head evidence

- Isolated server: `ws://127.0.0.1:58560`; Web/Lynx-for-Web origin: `http://localhost:9261`.
- Server instance: `41643b36-84e9-4fc5-b816-a7d11af62543`.
- Canonical fixture: project `project-env-fidelity`, thread `thread-env-fidelity`, workspace `/Users/bytedance/github/synara`.
- Web route was entered through the rendered sidebar row and resolved to `/thread-env-fidelity`.
- Lynx-for-Web route: `/lynx/index.html?route=/thread/thread-env-fidelity&environment=open`.
- Named browser sessions used exact `1280x820` and `900x700` viewports at DPR 1; PNG dimensions match.
- The Lynx target is a real `X-VIEW SliceRoot`, not the Web SPA fallback.
- A trusted pointer click on the rendered `EnvironmentToggle` writes the idempotent `environment=open|closed` URL target and reloads the Lynx page. Native retains its original `bindtap` path.
- At 1280x820 dark, Web and Lynx match the 312px overlay footprint, x=968/y=46 anchor, 288px surface width, 18px radius, 1px semantic border, 12px outer padding, 6px content padding, 2px content gap, and exact 12px/18px Environment title geometry.
- Dark resolves to `rgb(23,23,23)` / `rgb(252,252,252)` with matching Web geometry. A fresh isolated light-only harness retained nonblank paired frames: Web surface `288x565.5`, Lynx surface `288x455`, with matching x/y/width/radius/background/foreground. The height difference is the recorded nested-data limitation, not shell paint drift.
- The Web Elements `x-scroll-view` default `flex:1;height:100%` incorrectly stretched a short Environment panel to the full 750px available height. The Web host now injects an Environment-scoped compatibility rule (`flex:0 1 auto; height:auto; min-height:0; max-height:100%`), restoring content-sized geometry while preserving overflow capability.
- Environment nested Git/local-server/usage queries remain a known ReactLynx/Web Elements owner limitation: retained Lynx evidence does not claim loaded Git rows or middle/bottom scroll parity. The original Web authority remains the content source, while Native certification remains blocked by the documented Lynxtron snapshot parser issue.
- Console gate: known Lynx Web initialization warning only; no page errors. The isolated server lacks `codex` in PATH, so provider model discovery errors are fixture limitations and do not affect Environment layout.
