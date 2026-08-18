# Settings Skills Toggle Roundtrip

## Classification

- New scope: Settings Skills × populated real catalog × `adapt` enabled/off/on
  roundtrip × dark × `1280x820` × rendered switch interaction.
- Missing coverage:
  `settings-skills-toggle-roundtrip-current`, `1.00 -> 0.00`.
- Product pass:
  `settings-skills-toggle-layout-current`, `0.00 -> 0.00`.
- Unresolved harness/state mismatch:
  `native-skills-sidebar-width-state`, `1.00 -> 1.00`.
- Resolved harness command error:
  `skills-toggle-browser-get-subcommand`, `1.00 -> 0.00`.

No product score was reduced for the Native sidebar mismatch. No catalog,
setting, or screenshot was fabricated.

## Comparable Baseline

Web authority and Lynx-for-Web used:

- server:
  `ws://127.0.0.1:58090`;
- server instance:
  `cbfdb4e0-74c1-4df4-9d6f-7d6f358c6de1`;
- route:
  Settings Skills;
- dark theme;
- viewport:
  `1280x820`, DPR `1`;
- real catalog:
  `116` grouped skills;
- initial `adapt` state:
  enabled.

The first `adapt` row was exact:

- row:
  `622x123.5 @ (457,333.5)`;
- switch:
  `32x20 @ (1035,354)`;
- accessible name:
  `Enable the adapt skill`;
- enabled state:
  `true`.

Lynx relay diagnostics recorded one connection attempt,
`connect-attempt -> feature-open -> connect-success -> socket-owned`, socket
state `1`, zero pending requests, the expected `/settings/skills`
renderer-ready route, and no transport or RPC error. Browser page errors were
empty.

## Canonical Roundtrip

The retained behavior sequence used only rendered product controls:

1. Web authority clicked the enabled `adapt` switch.
2. The Web switch changed `true -> false` and persisted through
   `server.updateSettings`.
3. A fresh Lynx-for-Web page loaded `adapt` as disabled.
4. A real pointer press/release at the rendered Lynx switch center
   `(1051,364)` restored it.
5. Lynx issued `server.updateSettings` and rendered the on class.
6. A fresh Web page loaded `adapt` as enabled again.

The final server setting therefore matches the initial state. No skill remains
disabled from this loop.

The first attempt stopped before clicking because the probe used the invalid
agent-browser subcommand `get attribute`; the cleanup gate passed and the
retry used `get attr`. This is a harness command failure, not a product
interaction failure.

## Exact Native

Native was exercised through real rendered navigation:

1. the sidebar Settings button;
2. the Settings Skills navigation row.

The exact-owned client then exposed:

- real `adapt` title and description;
- both real provider paths;
- switch accessible name:
  `Enable the adapt skill`;
- accessible value:
  `On`;
- `aria-checked=true`;
- fresh warning/error console:
  empty;
- one established server socket.

The Native screenshot was not used for whole-page visual attribution because
its persisted sidebar width was `320px`, while the two browser clients used
`240px`. This is an explicit state mismatch. The Native evidence certifies
route reachability, real catalog state, accessibility, and connection health
only.

## Verification

- Web and Lynx-for-Web used the same server, real catalog, route, theme,
  viewport, and initial/final setting.
- The rendered off/on roundtrip restored the original server setting.
- Native used the PID-derived `@synara/lynx` client, not the unrelated
  `localhost:8901` client.
- No browser page errors or exact-client warning/error logs were retained.
- No screenshots were added; repository screenshot count remained `100`.
- Temporary screenshots are deleted after the sibling provider-prompt slice is
  certified.
- Every failed browser or probe command was followed by `browser:gate`.
