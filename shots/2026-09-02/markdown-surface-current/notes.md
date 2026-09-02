# Current Markdown surface recapture

Status: retained matched Electron and Lynx-for-Web fast-loop evidence for the
historical August 2 Markdown light and dark states.

## Identity

- Source commit: `4d420d88d` (`Track authenticated relay reliability`).
- Backend: `ws://127.0.0.1:57198/?token=synara-local-desktop-comparison`;
  server instance `82ba5bed-296b-4ab2-9ba9-7ebc7efa8fff`.
- Thread: `fidelity-markdown-dark-20260902-b`, created through canonical
  `thread.handoff.create` from project
  `7853cb49-7a94-4541-ac06-7fd877f3f871`.
- Route: Electron `#/fidelity-markdown-dark-20260902-b`; Lynx-for-Web
  `/lynx/index.html?route=%2Fthread%2Ffidelity-markdown-dark-20260902-b`.
- Viewport: `1280x820`, DPR 1; every retained PNG is exactly `1280x820`.
- State: same canonical user/assistant messages, sidebar open, Chats state
  aligned, dock closed, and no dialog, toast, or provider-update overlay.
- Endpoint-pinned Lynx-for-Web bundle SHA-256:
  `aa84ea10a4d71a0cf1c3f145a5502a4eb093dd3f5c65e4a49ae48e5d80fc5245`.
- The authenticated relay connected on its first attempt to the same backend,
  reached `socketState: 1`, reported the expected renderer-ready thread route,
  and had no transport or RPC error.

## Fixture

The canonical transcript contains one user request and one assistant response
with a level-two heading, two unordered-list items, one fenced JavaScript code
block, and one Markdown link. No provider turn or SQLite fixture write was
used.

## Results

- Light: `1.2959141608879323%` RGB MAE, replacing the valid historical light
  sample at `3.5946676231468198%`.
- Dark: `1.4813689373106964%` RGB MAE, replacing the valid historical dark
  sample at `3.1481740943328553%`.
- The historical nominal light `after` pair remains rejected as a dark/light
  capture mismatch and is not superseded by this evidence.

The current residual is real product fidelity loss: Electron uses a wider
Markdown content rail and code block and applies syntax highlighting, while
Lynx-for-Web keeps a narrower rail and renders monochrome code. The retained
frames deliberately preserve that residual for the next implementation slice.

## Gates

- Both themes were selected through rendered Settings controls.
- The fixture thread and Chats state were selected through rendered sidebar
  controls. Electron required a route reload after returning from Settings to
  rehydrate the transcript; only the post-hydration frame was retained.
- Provider-update overlays seen during initialization were dismissed in both
  clients before capture.
- Electron light diagnostics assert fixture content present, new-chat home
  absent, overlay absent, `1280x820`, and DPR 1.
- Lynx relay diagnostics identify the same backend/server instance and expected
  renderer-ready route. The retained Lynx light page-error buffer is empty.
- Browser cleanup entry, failure-retry, and exit gates reported no sessions and
  no agent-browser-owned processes.
