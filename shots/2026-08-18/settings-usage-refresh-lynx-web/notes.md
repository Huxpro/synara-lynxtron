# Settings Usage Refresh Lynx-for-Web

## Classification

- New interaction scope: Settings Usage × mixed provider state × dark ×
  `1280x820` × real Refresh click in Lynx-for-Web.
- Missing coverage:
  `lynx-web-settings-custom-click`, `1.00 -> 0.00`.
- Product result:
  pass.
- Two harness probe errors were resolved and not attributed to product code.

## Identity

The final cell used:

- server:
  `ws://127.0.0.1:58090`;
- server instance:
  `c7fea750-6510-4770-a0ca-c78804443bb8`;
- route:
  `/settings/usage`;
- dark theme;
- viewport:
  `1280x820`, DPR `1`;
- real mixed provider state.

## Rendered Interaction

The native custom-element Refresh action was found through the Lynx shadow
root:

- accessible name:
  `Refresh provider usage`;
- box:
  `72x24 @ (1008,119)`;
- center:
  `(1044,131)`.

The harness waited until the button no longer carried `ui-disabled`, then sent
a real pointer move/down/up sequence at its rendered center.

Relay diagnostics proved the product path:

- `server.listProviderUsage` count:
  `1 -> 2`;
- connection attempts:
  `1`;
- pending requests after completion:
  `0`;
- transport error:
  none;
- RPC error:
  none;
- page errors:
  empty.

## Harness Failures

The first probe clicked while the initial Usage request still owned the
disabled state and also used a stale y coordinate. It emitted no second RPC.

The second probe used agent-browser's ordinary selector wait. That API searches
the light DOM and cannot see the Lynx shadow root, so it timed out before any
click.

Both loops stopped and passed `browser:gate`. The retained workflow uses an
explicit deep-shadow readiness poll before the real pointer action.

## Verification

- No settings or provider state changed.
- No screenshot was added; repository count remained `100`.
- Browser ownership cleanup returned zero sessions and zero owned processes.
