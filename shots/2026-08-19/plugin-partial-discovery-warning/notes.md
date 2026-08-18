# Plugin Partial Discovery Warning Fidelity

## New Scope

- Plugin Library partial-success provider discovery;
- one enabled plugin remains usable while another marketplace fails to load;
- real provider switching through rendered controls;
- light theme, `1280×820`, DPR `1`;
- Web authority, Lynx-for-Web, and exact-owned Native correlation.

This state was not covered by the existing full failure, unsupported provider,
empty result, populated result, search, or provider-switching evidence.

## Shared Snapshot

An isolated Factory/Droid home produced the state through the canonical
provider discovery API:

- server: `ws://127.0.0.1:58190`;
- state: `/tmp/synara-plugin-partial-state/dev/state.sqlite`;
- provider: `droid`;
- marketplace `official`: one installed and enabled `Reviewer` plugin;
- marketplace `broken`: missing/invalid manifest;
- canonical result: one marketplace, one plugin, one
  `marketplaceLoadErrors` entry, no transport error.

No SQLite fixture mutation was used. The marketplace files were read by the
real `FactoryPluginDiscovery` path behind `provider.listPlugins`.

The server was restarted only to switch its trusted browser origin from Web
`http://localhost:9121` to Lynx-for-Web `http://localhost:8080`; the state and
Factory fixture stayed unchanged.

## Product Loss

Web authority preserved partial discovery:

- warning:
  `/private/tmp/synara-plugin-partial-home/.factory/plugins/marketplaces/broken: Factory marketplace manifest is missing or invalid.`;
- warning geometry: `624×54 @ (456,216)`;
- Reviewer row geometry: `492×68 @ (276,320.5)`.

Lynx-for-Web and Native rendered the Reviewer row but silently discarded both
`remoteSyncError` and `marketplaceLoadErrors`. This was a P1 data-reliability
loss: the provider remained usable, but users could not see that part of
discovery had failed.

## Fix

- Added `providerPluginDiscoveryWarnings` to
  `@synara/shared/providerDiscoveryPresentation`.
- Both Web and Lynx now use the same ordering and formatting for remote-sync
  and marketplace-load warnings.
- Lynx renders warning cards between search and content, using shared warning
  color tokens and the existing alert icon.
- Partial rows remain visible; full error, unsupported, loading, and empty
  state precedence is unchanged.

## Lynx-for-Web After

- URL: `http://localhost:8080/?route=%2Fplugins`;
- viewport and PNG: `1280×820`, DPR `1`;
- rendered Droid control center derived from current geometry:
  `922.875×22.5`;
- interaction: real mouse move/down/up on the rendered Droid control;
- relay: configured and active `ws://127.0.0.1:58190`;
- server instance:
  `9fda0214-12a1-4d22-a2b7-857faec853ee`;
- recent RPC history gained a second `provider.listPlugins`;
- warning geometry: `672×56 @ (432,212)`;
- Reviewer row geometry: `405×70 @ (362,292)`;
- page errors: none.

The provider-update prompt was dismissed through its rendered control before
the retained after frame so the compared product state matched Web authority.

## Native After

- exact-owned PID: `38268`;
- PID-derived DevTool client: `localhost:8903`, session `1`;
- isolated user data:
  `/tmp/synara-plugin-partial-native-data`;
- outer window: `1280×820`;
- DevTool PNG: `2560×1640`, DPR `2`;
- route: `/plugins`;
- endpoint: every retained RPC used `ws://127.0.0.1:58190`;
- staged bundle SHA-256:
  `4ea5da1f3572a9a8c4ba3f39b714a97f61fe2360736b2ac8f0905bb12eec6316`;
- staged desktop main SHA-256:
  `3bda3e635d0be05293ba2fe79d9f4182fb4c51ce3b83c9771c2e7d6c3182115e`;
- real Droid activation emitted `provider.getComposerCapabilities` and
  `provider.listPlugins`;
- warning border: `672×56 @ (432,212)`;
- warning content: `646×34 @ (445,223)`;
- Reviewer border: `405×70 @ (362,292)`;
- exact-client error/warning console: empty.

## Harness Classification

- Starting Web without a matching `--dev-url` produced an empty frame with no
  page errors. This was rejected as origin-admission harness loss.
- The first Lynx-for-Web dev launch hit an Rspeedy/Rsbuild copy race. The
  retained run used a sequential production build and static host.
- Static `/index?route=...` redirected to `/` and dropped the query. The
  retained URL used `/?route=%2Fplugins`.
- Agent-browser cannot select Lynx Web Core provider controls through the
  accessibility tree. Retained interaction used the current rendered control
  geometry followed by real mouse input, not a programmatic `.click()` or
  state mutation.
- The first Native launch loaded a bundle compiled for the default server and
  was rejected. Retained Native evidence used the rebuilt endpoint-specific
  bundle and PID-derived client.
- The initial Lynx-before screenshot included a provider-update prompt while
  Web did not. It was not retained as a visual comparison sample.

The screenshots remained in `/tmp`; only their dimensions and runtime evidence
are retained. The repository screenshot count remains exactly `100`.

## Verification

- shared presentation tests: `6/6`;
- Web Plugin Library tests: `1/1`;
- Lynx Plugin Library tests: `3/3`;
- Web production build: passed, `8954` modules;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- browser ownership entry, every failure retry, and final exit:
  `sessions: []`, zero agent-browser-owned processes.

## Final Runtime

All isolated fixture, browser, server, and Native processes were stopped. The
user instance was restored to the default `ws://127.0.0.1:58090` bundle and
left running on Settings → AppSnap:

- Native PID: `55906`;
- server PID: `86856`;
- final default bundle SHA-256:
  `127a00cf64d260c8dc8c8ea3308cbe8ff7bb15fdee2f2bfe0def5421358e3761`.
