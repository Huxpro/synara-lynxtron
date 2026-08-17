# Viewport Single Owner And Update

## Classification

- New interaction scope: live `900x650 -> 1024x700 -> 900x650` resize.
- Comparable screen: Settings General, dark, Web authority and Lynx-for-Web.
- Native-only screen: Update, exact-owned production instance.
- P1 reliability loss: `viewport-state-fanout`, `1.00 -> 0.00`.
- Intentional platform delta: Web has no `/update` route. Direct Web `/update`
  captures rendered Not Found/blank and were rejected before product scoring.
- Harness loss: two short Native probe sequences completed before DevTool
  registration and exposed only the final medium state. A long-hold sequence
  replaced them and captured the live transition.

## Root Cause

Lynx viewport state had two event owners:

1. `useLynxGlobalEventListener('onWindowResize', update)`;
2. `platformWindow.onViewportResize(update)`.

Both the Desktop and Web hosts already own their real platform resize event and
publish `viewport:resize`. On Desktop, one native resize therefore reached the
hook through the official event and the host-forwarded event. State equality
prevented a second render for identical dimensions, but every resize still
duplicated subscription work and coupled the hook to two event shapes.

## Fix

`useViewportLayout.lynx.ts` now has one platform abstraction owner:

- initial hydration: `platformWindow.getViewportSize()`;
- live changes: `platformWindow.onViewportResize()`;
- no direct ReactLynx `onWindowResize` subscription.

Web and Desktop hosts continue to translate exactly one platform resize source
into `viewport:resize`. The hook remains host-neutral and receives one stable
`ViewportSize` shape.

## Fast Loop

Settings General used equivalent routes:

- Web authority: `/settings` (General is the default section);
- Lynx-for-Web: `/settings/general`.

At `900x650`:

- both clients: DPR `1`, dark, Sidebar `256x650`, main/content `644x650`;
- Lynx root: `SliceRoot--viewport-medium`, data width/height `900/650`;
- Web/Lynx MAE: `1.5686013072%`;
- Web/Lynx parity: `98.4313986928%`;
- page errors: empty;
- Web console: Vite/React development messages only;
- Lynx console: unchanged upstream WASM initialization deprecation warning.

At `1024x700`:

- both clients: Sidebar `256x700`, main/content `768x700`;
- Lynx root: `SliceRoot--viewport-wide`, data width/height `1024/700`.

Returning to `900x650` restored the original geometry exactly. The same
Lynx-for-Web relay socket remained open with one connection attempt and no
transport/RPC error.

## Native Batch

An exact-owned production instance used:

- current `apps/lynx/dist/desktop/main.lynx.bundle`;
- isolated `SYNARA_LYNX_USER_DATA_DIR`;
- user preview server `ws://127.0.0.1:58090`;
- PID-derived DevTool client `localhost:8903/session 1`;
- built-in viewport probe with long-held size phases.

The retained timeline captured:

1. `wide`, `1024x700`, window bounds `1024x700`;
2. `medium`, `900x650`, window bounds `900x650`.

The final Update frame is a Native-only platform cell:

- root: wide at `1280x820`;
- PNG: `2560x1640` at DPR `2`;
- warning/error console: empty.

The Update frame is not paired with Web because the Web product does not expose
that route.

## Verification

- Focused responsive/update Rstest: `2 files / 7 tests`.
- Lynx-for-Web production build passed.
- Native/Desktop production build passed.
- Browser workflows ran under `browser:run`.
- Every failed route/probe/timing attempt was followed by `browser:gate`.
- All isolated Native process/state resources were removed.
- User preview server and Native app remained running.
- Local screenshot count remained exactly `100`.

## Evidence

- `web/raw.png`: Web Settings General, dark, `900x650`.
- `lynx/raw.png`: Lynx-for-Web Settings General, dark, `900x650`.
- `native/raw.png`: Native-only Update cell, light, `1280x820` logical.
- `geometry.json`: comparable dimensions and live band transitions.
- `console.json`: console classification and Native exact-client identity.

