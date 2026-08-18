# Provider Update Review Navigation

## Classification

- New scope: global provider prompt × Review updates × Settings Skills to
  Providers navigation × dark × rendered interaction.
- P1 product loss:
  `lynx-provider-update-review-route-sync`, `1.00 -> 0.00`.
- Resolved harness losses:
  `provider-review-decimal-pointer-probe` and
  `provider-review-native-wrapper-probe`.

No loss weight, sample filter, or scope reduction changed.

## Web Authority

Web authority used a real rendered Review updates button from Settings Skills.
The result was:

- URL:
  `/settings?section=providers&target=provider-updates`;
- heading:
  `Providers`;
- provider update prompt:
  closed.

## Discovery

Lynx Review updates called `history.push('/settings/providers')` and dismissed
the prompt, but the visible panel remained Skills.

The router correctly projected the new route prop:

- `initialSection='providers'`.

The mounted `SettingsPage` initialized local state once:

- `useState(initialSection)`.

It never synchronized later `initialSection` changes. Because navigation
between Settings sections reuses the same `SettingsPage` instance, the route
changed while the visible local section stayed stale. The prompt disappeared,
making the action appear to work even though Providers never opened.

## Fix

`SettingsPage` now synchronizes route-owned inputs whenever they change:

- section from `initialSection`;
- pending deep-link target from `initialTarget`;
- stale search query cleared.

Rendered Settings sidebar selection remains local state and is not overwritten
unless an external route input actually changes.

## Lynx-for-Web

Before the fix:

- real Review click:
  prompt closed;
- heading:
  still `Skills`;
- provider target:
  absent;
- relay:
  healthy, one connection, no transport/RPC error.

After the fix:

- real pointer press/release on Review updates;
- prompt:
  closed;
- heading:
  `Providers`;
- `#provider-updates`:
  present;
- relay:
  still one connection, socket state `1`, zero pending requests, no
  transport/RPC error;
- page errors:
  empty.

The first automation retry used a decimal mouse coordinate. Agent-browser
requires integer coordinates, so it stopped before clicking. The loop passed
`browser:gate` and retried with `(534,113)`.

## Exact Native

Final exact-owned Native:

- PID:
  `43730`;
- PID-derived DevTool:
  `localhost:8902`, session `1`;
- bundle SHA-256:
  `4b896e07f29b337af95d4756c8b4b5849ae5d093e8684ba7fd0089f439ff0400`;
- starting route:
  `/settings/skills`;
- server socket:
  established to `127.0.0.1:58090`.

The first DevTool search selected the `ProviderUpdatePromptActions` wrapper
instead of the Review button. Its `304px` box did not activate an action. This
was rejected as a harness targeting error.

The retry selected the first `LxButton ... ProviderUpdatePromptAction` node
and sent a real DevTool press/release at its center. Final Native state:

- prompt hosts:
  `0`;
- heading:
  `Providers`;
- provider update target:
  present;
- warning/error console:
  empty;
- server socket:
  remained established.

## Verification

- focused settings navigation and prompt tests:
  `2 files / 16 tests`;
- Lynx-for-Web production build passed;
- Lynx/Desktop production build and Sharp staging passed;
- Web authority, Lynx-for-Web, and exact Native real Review interactions
  passed;
- no provider update was executed;
- no screenshots added; repository count remained `100`;
- temporary DevTool JSON was deleted before commit;
- every failed browser or DevTool probe was followed by `browser:gate`.
