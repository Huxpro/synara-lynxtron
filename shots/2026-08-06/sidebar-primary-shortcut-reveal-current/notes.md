# Sidebar primary shortcut reveal current-head fidelity

Status: retained Web behavior measurement, real Lynx-for-Web interaction, and
exact-owned Native default-state evidence

- Source base: `05390da5`.
- Current Web keeps New thread and Search shortcuts at `opacity: 0` by default.
  Real row hover or focus-visible reveals them at `opacity: 1` through a
  `150ms` opacity transition with `cubic-bezier(0.4,0,0.2,1)`.
- Before this slice, Lynx shortcuts remained visible at `opacity: 1` in the
  default state.
- `.AppSidebarShortcut` now owns the same default opacity and transition.
  Shared primary-action `ui-hover` and `ui-focus` states reveal the shortcut;
  no new component-specific interaction state machine was added.
- The first post-patch Lynx-for-Web probe correctly hid the shortcuts but
  exposed a harness gap: real browser pointer hover did not dispatch Lynx
  `bindmouseenter`, so the product row never gained `ui-hover`. That failed
  capture was not retained as passing evidence.
- `main/web/web-interaction-state.ts` now gives the Web-only harness one
  general bridge from Lynx `focusable="true"` to real Web tab stops and from
  composed `mouseover` / `mouseout` and `focusin` / `focusout` events to the
  existing `ui-hover` / `ui-focus` contract. It uses WeakSet ownership so it
  never removes a tab stop or class that the Lynx runtime or product already
  owned. This module is imported only by the Web host and is absent from the
  Desktop/Lynx bundle.
- Final real Lynx-for-Web pointer sequence proves default `opacity: 0`, New
  thread row class `ui-hover` with shortcut `opacity: 1`, and restoration to
  `opacity: 0` after pointer leave. Search remains hidden while New thread is
  hovered. A real keyboard Tab traversal also reaches the New thread
  `X-VIEW` at `tabIndex=0`, publishes `ui-focus` / `:focus-visible`, and
  resolves the shortcut to `opacity: 1`. Retained Browser PNGs are `1280x820`
  and browser errors are empty.
- Focused suites: 2 files, 6/6 tests. They cover segmented shortcut anatomy,
  CSS reveal states, real Lynx interaction-class publication, Web-host
  tab-stop/pointer/focus mapping, dynamic focusable nodes, and host/runtime
  ownership boundaries.
- Configured Lynx-for-Web and Native/Desktop production builds pass. Expected
  encoder and optional `ws` native-module warnings are unchanged.
- Exact-owned Native bundle
  `74464b6d34c9d034d2ac3a6da8b8ffbbe15ccce6d6e076323e523f55d4920a92`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8904/session 1`.
- Native default shortcut style resolves to `opacity: 0`, `44x20`, transition
  property `[opacity]`, duration `[150]`, and timing
  `[cubic-bezier(0.4,0,0.2,1)]`. The raw frame is `2560x1576` and the
  warning/error console is empty.
- Native hover is not claimed: Desktop DevTool does not provide a reliable
  retained `mouseenter` path in this harness. Native focus/hover class
  publication remains covered by the real Lynx interaction-state contract;
  Browser pointer behavior is proven through the final Web-only host bridge.
- Cleanup: the exact-owned root and child exited and unrelated Lynxtron
  instances were not touched.
