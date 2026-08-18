# Native System Notification Fidelity

## New Scope

- Settings → Notifications;
- Native light theme, `1250×896` logical content at DPR `2`;
- system notification capability, Test interaction, delivery acknowledgement,
  settings control state, and click-to-thread host contract;
- chat completion/input-needed and managed-terminal completion/attention
  outcomes;
- hydration freshness and same-snapshot multi-thread completion.

This scope had not previously been Native-certified. Existing work covered
in-app activity toasts but treated system notifications as unavailable.

## Product Loss

Web original supports OS notifications for all four activity outcomes when the
system-notification setting is enabled:

- chat completed;
- chat needs approval or user input;
- managed terminal completed;
- managed terminal needs attention.

Lynx had a persisted `enableSystemTaskCompletionNotifications` setting, but the
Settings control was permanently disabled, claimed that the runtime was
unsupported, and no renderer-to-main notification bridge existed. This was a
P1 outcome loss: background work could complete or block without the OS-level
signal available in the original desktop product.

The Lynx summary detector also differed from the Web runtime in two reliability
boundaries:

- hydrated transitions older than the notification runtime could be emitted as
  live events;
- a polling snapshot containing several completed threads was reduced to only
  the last in-app toast, with no separate system delivery for every completion.

## Fix

- Added a background-only notification platform port.
- Added Native host methods for capability detection and delivery.
- Added a Lynx-for-Web host fallback that explicitly reports unsupported rather
  than pretending browser permission semantics are equivalent.
- Added a main-process `Notification` service using the real native
  `require('lynxtron')` object.
- Kept notification objects alive until `close` or `failed`.
- Defined successful delivery as the native `show` event, not merely calling
  `show()`. A `failed` event or three-second timeout returns failure.
- Native notification clicks route to `/thread/<threadId>` and activate the
  exact thread.
- Chat and terminal system delivery is independent from in-app toast
  visibility, matching Web original.
- All fresh same-snapshot candidates receive system delivery; only the newest
  off-screen candidate occupies the single in-app toast surface.
- Runtime freshness suppresses old hydrated completion/input transitions.
- Settings now capability-gates the toggle and Test action, and reports the
  delivery result.

## Upstream Finding

Lynxtron `0.0.12-dev` declares `Notification.isSupported()` in its TypeScript
API but does not attach that static method in the C++ constructor binding.
`lynxtron.js` also omits the `Notification` named ESM export even though the
native CommonJS object contains the class.

Tracked upstream:

- https://github.com/lynx-family/lynxtron/issues/197

Synara uses a narrow compatibility adapter: constructor presence is the
capability gate, while actual delivery is verified through the native
`show`/`failed` events. This avoids a false unsupported result without claiming
delivery before the platform confirms it.

## Native Evidence

Exact-owned process:

- PID: `36971`;
- executable:
  `node_modules/.bun/@lynx-js+lynxtron@0.0.12-dev/node_modules/@lynx-js/lynxtron/dist/lynxtron.app/Contents/MacOS/lynxtron`;
- staged app: `apps/lynx/dist/desktop`;
- route: `synara://settings/notifications`;
- PID-derived DevTool client: `localhost:8902`, session `1`;
- loaded bundle:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.

Geometry and state:

- root logical viewport: `1250×896`;
- screenshot: `2500×1792`;
- root theme: `SliceRoot--theme-light`;
- system notification control: `77×24 @ (1038,258)`;
- Test button: `37×24 @ (1038,258)`;
- system switch: `aria-disabled=false`, `aria-checked=true`, value `On`.

The visible Test button was activated through the product node at
`(1056,270)`. The main process received:

`bridge.notificationsShow { title: "Synara notifications", body: "Notification test for chats and terminal agents." }`

The page changed to `Test notification sent.` only after the macOS
`didDeliverNotification` callback propagated as the native `show` event.
Exact-client error/warning console remained empty.

Retained screenshot:

- `native/test-delivered-light-1250x896@2x.png`;
- SHA-256:
  `f62d41c3491f9ccd91d9547eae37a5c41132f4f5daf7fb922c9f411ae16d39db`.

One historical pull-request interaction PNG was removed because it was
byte-identical to two retained frames in the same sequence. This keeps the
repository screenshot count at `100`; no failed sample was filtered and no
loss weight or scope was changed.

## Lynx-for-Web Correlation

The trusted-origin Lynx-for-Web client used the same route, theme, logical
viewport, server, and persisted settings:

- URL:
  `http://localhost:8891/lynx/index.html?route=%2Fsettings%2Fnotifications`;
- viewport: `1250×896`, DPR `1`;
- row: `622×99 @ (442,231)`;
- system switch: `32×20 @ (1020,261)`;
- switch: `aria-disabled=true`, `aria-checked=true`;
- status: `System notifications are unavailable in this runtime.`;
- page errors: none;
- console: only the known upstream Web initialization deprecation.

This is an intentional capability delta rather than a Native product loss:
Lynx-for-Web does not impersonate a browser `Notification` permission flow,
while Web original continues to own that browser-specific behavior.

## Verification

- notification host/delivery tests: `3/3`;
- task/terminal detector tests: `11/11`;
- notification Settings source contracts: `11/11`;
- rendered toast host tests: `2/2`;
- focused total: `27/27`;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- staged Native bundle SHA-256:
  `3650b7786d7a1de437c88a00e6bf7b5e3d4c2170aa5ef95636f494764e7ababf`;
- staged desktop main SHA-256:
  `b883ccea5be994a98aaeca9b02d8eeeed2607c95727b10fc2d7d094f0f7aa8f1`;
- browser ownership gates: `sessions: []`, zero agent-browser-owned processes;
- local screenshot count: `100`.

## Classification

- Native missing OS notification outcome: P1 product capability loss, closed.
- Hydrated stale notification replay: P1 product reliability loss, closed.
- Same-snapshot multi-completion loss: P1 product reliability loss, closed.
- Lynx-for-Web system notification unsupported state: intentional platform
  delta; browser permission behavior remains Web original's responsibility.
- Missing Lynxtron static/ESM API: upstream platform defect, locally bypassed
  and tracked in issue #197.
