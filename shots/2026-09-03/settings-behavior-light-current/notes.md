# Current Settings Behavior light recapture

Status: retained matched Electron and Lynx-for-Web evidence for the stable
Settings Behavior surface after removing the Lynx-only hydration success row.

## Identity

- Product commit: `ed16b5c06` (clean detached worktree).
- Backend: `ws://127.0.0.1:62006/?token=synara-local-desktop-comparison`;
  server instance `fadf7faa-1714-4216-8d8d-0037ee0d5b4a`.
- Snapshot SHA-256:
  `019d1e149209933e79a7caa929ebfaaa00765b2abef92e8f5e5eb0a75a2d8d22`.
- Route: Electron `#/settings?section=behavior`; Lynx-for-Web
  `/lynx/index.html?route=%2Fsettings%2Fbehavior`.
- Viewport: light `1280x820`, DPR 1; both PNGs are exactly `1280x820`.
- Endpoint-pinned Lynx-for-Web bundle SHA-256:
  `1cfc5ebeeff5df160826d9c00c047bb0c6983b3c6411197a9643cbed3a52f23b`.
- State: the same five Behavior controls and values, 256px Settings sidebar,
  no AppSnap dialog, no provider-update prompt, and no transient success row.

Electron reached the state through rendered Not now, Dismiss toast, Settings,
Appearance, Light, and Behavior controls. Lynx-for-Web loaded the explicit
Behavior route, then dismissed the same provider-update prompt with a real
pointer click.

## Result

- Current RGB MAE: `0.7313075382592061%`.
- Superseded P8-Q2 light `1280x820` Browser MAE:
  `1.675639646102343%`.
- Electron and Lynx-for-Web show the same text, control values, sidebar state,
  route, theme, viewport, DPR, and overlay state.
- Neither frame contains the obsolete `Preferences loaded.` success row.
- Both page-error buffers are empty.
- Lynx relay connected on its first attempt to the recorded backend, reported
  `/settings/behavior`, had zero pending unary requests, and reported no
  transport or RPC error. Its only active request was the expected
  `terminal.subscribeEvents` stream.

## Artifacts

- `web-light-1280x820.png`: Electron authority.
- `lynx-light-1280x820.png`: Lynx-for-Web.
- `pngs.sha256`: byte identities for both retained frames.

Browser entry, retry, capture, and exit gates all reached zero named sessions
and zero agent-browser-owned processes. The isolated Electron/backend and Vite
processes were stopped, and ports `58432`, `58433`, `58434`, and `62006` were
confirmed free.
