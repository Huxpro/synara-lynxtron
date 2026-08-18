# Settings Notifications Current Head

## Classification

- New scope: Settings Notifications at `1280x820`, dark, including capability
  state and Native switch interaction.
- P1 product loss:
  `lynx-offscreen-chat-activity-toasts-unavailable`, `1.00 -> 0.00`.
- Missing coverage: managed terminal completion/attention toasts still lack a
  global Lynx terminal-state projection.
- Intentional platform delta: operating-system notifications remain unavailable
  without a Lynxtron notification bridge.
- Harness failures: the first Native touch reused a Web coordinate and missed;
  the next successful Off transition was followed by an incorrect shell regex.
  Both failures were followed by a clean `browser:gate`; the setting was then
  restored to On and independently verified.

## Discovery

The historical Notifications evidence predated current HEAD. A fresh
Web/Lynx-for-Web dark `1280x820` cell used the same server, persisted settings,
viewport, DPR `1`, and route state.

Shared layout anchors already matched:

- Notifications content heading/section anchor:
  `624x26 @ (456,118)` in both clients;
- two standard `32x20` switches in the shared settings rows.

Web authority supported in-app activity toasts plus browser/desktop
notifications. Lynx rendered both switches disabled and stated that in-app
activity toasts were unavailable. In-app toast presentation does not depend on
an OS notification API, so disabling it was a product capability loss rather
than a platform delta.

## Product Fix

- Project shell summaries now retain pending approval/user-input flags and the
  latest turn completion state/time.
- A pure detector compares consecutive 5-second shell snapshots and emits only:
  - off-screen `live -> completed` thread transitions with a settled completed
    turn;
  - fresh off-screen approval or user-input transitions.
- Attention transitions take priority over completion so a waiting thread is
  never mislabeled as finished.
- Initial hydration, visible threads, errors, reconnect stops, and non-completed
  settled states do not notify.
- Copy generation reuses Web's shared completion/input-needed helpers.
- One root-owned Lynx toast host provides title, body, Open, dismiss, and an
  8-second lifetime without adding a second polling loop.
- The persisted `enableTaskCompletionToasts` preference is honored.
- Settings now exposes the Activity toast switch as interactive while keeping
  Desktop activity notifications disabled.

Managed terminal activity remains explicitly outside this slice because Lynx
does not yet own a global terminal-state projection. The status copy names
off-screen chats rather than claiming terminal parity.

## Web And Lynx-for-Web

Before the fix, the Lynx Notifications panel rendered:

- Activity toast switch: disabled, checked;
- Desktop activity switch: disabled, checked;
- `In-app activity toasts are unavailable in this runtime.`;
- `System notifications are unavailable in this runtime.`.

After the fix:

- Activity toast switch: focusable, `aria-disabled` absent, checked;
- Desktop activity switch: still `aria-disabled=true`, checked;
- status:
  `In-app activity toasts are shown for off-screen chats.`;
- system notification status remains unchanged.

The rendered Lynx activity switch stayed `32x20 @ (1035,171)` in the
`1280x820` dark cell. Relay diagnostics recorded one connection attempt,
`feature-open -> connect-success -> socket-owned`, socket state `1`, zero
pending requests, and no transport/RPC error. Browser page errors were empty.

The toast host state machine was verified through real ReactLynx
render/rerender tests:

1. initial hydration renders no toast;
2. an off-screen live thread settling with a completed turn renders the shared
   `Finished working.` copy;
3. fresh user-input state renders warning copy;
4. Open dispatches the thread route callback;
5. dismiss removes the toast.

## Exact Native

The exact-owned production instance is:

- PID `94372`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- production session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `1e170a2a15cb4541ad026d3c8551044cb6398d759fa13d2f8ff5ce6733ded79a`;
- one established socket to `127.0.0.1:58090`.

Native DOM proved:

- Activity toast switch:
  focusable, interactive, `aria-disabled=false`;
- Desktop activity switch:
  unfocusable, inert, `aria-disabled=true`;
- both capability status strings matched the fast loop.

PID-derived DevTool geometry located the Activity switch at physical
`32x20 @ (1075,170)`. Supported touch input completed a real
`On -> Off -> On` roundtrip. Final DOM independently confirmed
`aria-checked=true`, and fresh exact-client warning/error console output was
empty.

## Verification

- focused runtime/settings tests: `4 files / 19 tests`;
- Lynx-for-Web production build passed;
- complete Lynx/Desktop production build passed;
- final persisted Activity toast setting restored to On;
- no screenshots added; repository screenshot count remained `100`;
- browser ownership gate returned `sessions: []` and zero agent-browser-owned
  processes.
