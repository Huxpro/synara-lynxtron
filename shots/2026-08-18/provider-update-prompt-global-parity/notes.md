# Provider Update Prompt Global Parity

## Classification

- New scope: provider updates × global app shell × Kanban project × dark ×
  `1440x900`.
- P1 product loss:
  `lynx-global-provider-update-prompt`, `1.00 -> 0.00`.
- Harness loss:
  `lynx-web-provider-prompt-shallow-dom-probe`, `1.00 -> 0.00`.
- No weight, sample, or scope reduction was used.

## Discovery

Web authority rendered its persistent provider-update warning over the Kanban
project board while Lynx exposed update status only inside Settings Providers.
Every non-Settings Lynx route therefore lacked the global update notice and its
direct actions.

The observed update set contained three providers. Shared filtering and naming
resolved the authority copy to:

- `3 provider updates available`;
- `Claude and 2 more providers have newer versions available.`;
- `Review updates`;
- `Update all`.

## Fix

The Lynx router now owns one `ProviderUpdatePrompt` beside the existing
root-owned completion-toast host in both normal and Settings route branches.
The prompt:

- reuses the shared visible-provider filter, notification key, provider names,
  and provider-update timeout;
- fetches config and settings through background-only query functions instead
  of importing the background transport into a main-thread component;
- routes Review to Settings Providers;
- updates all eligible providers with `Promise.allSettled`;
- dismisses only after every update succeeds;
- remains visible with failure copy when any update fails;
- exposes an explicit dismiss name and uses the central close icon.

## Web And Lynx-for-Web

The post-fix Lynx-for-Web cell used:

- route:
  `/kanban/1d01802b-84d1-4f75-9c88-d84bb661107c`;
- dark theme;
- `1440x900`, DPR `1`;
- server instance:
  `cbfdb4e0-74c1-4df4-9d6f-7d6f358c6de1`;
- server:
  `ws://127.0.0.1:58090`.

The deep shadow-root probe proved:

- exactly one `.ProviderUpdatePrompt`;
- border box:
  `420x72 @ (510,16)`;
- title and description exactly match Web authority;
- Review, Update all, and dismiss are visible;
- fixed placement, centered transform, warning border, and dark elevated
  background are resolved.

Relay diagnostics proved a healthy connection:

- socket state `1`;
- one connection attempt;
- lifecycle:
  `connect-attempt -> feature-open -> connect-success -> socket-owned`;
- renderer-ready route matched the Kanban project;
- zero pending requests;
- no transport or RPC error;
- no browser page error.

The only console warning was the known upstream Web initialization deprecation
about passing a single object.

The first probe queried the light DOM and returned an empty body even though
the retained temporary screenshot visibly contained the complete app and
prompt. The loop stopped, `browser:gate` passed, and the retry used
`#root-view.shadowRoot` plus the host's
`__SYNARA_LYNX_RELAY_DIAGNOSTICS__()` API. This was a probe-method failure, not
a product render or connection failure.

## Exact Native

The rebuilt exact-owned production instance is:

- PID `51749`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- production session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `f92c438b1c3786ac8540fcba401feecea4f4b4a09b4b73b08386db77cccc33c3`;
- target route:
  `/kanban/1d01802b-84d1-4f75-9c88-d84bb661107c`.

Native DevTool proved:

- exactly one prompt host with the complete accessibility label;
- title, description, Review, Update all, and dismiss text/name;
- prompt border box:
  `420x72 @ (430,16)` in the `1280`-wide LynxView;
- fixed top/center placement and warning/elevated colors;
- fresh exact-client warning/error console output was empty.

The Native process held one established socket
`127.0.0.1:50324 -> 127.0.0.1:58090`, and the server owned the matching reverse
peer. Startup logs showed successful config, settings, shell snapshot, sidebar
snapshot, and renderer-ready RPC calls without reconnect or failure output.

## Connection And Upstream Assessment

This slice did not reproduce a current connection defect:

- Lynx-for-Web connected once with no retry or error;
- Native held one established server socket and completed every required RPC;
- exact-client console was clean.

There is therefore no evidence for a blocking Lynx or Lynxtron upstream issue
from this loop. No upstream issue was filed. A future repeat must capture the
current lifecycle, exact PID socket pair, exact-client console, and server peer
before attribution; historical Vite or relay logs are not valid current-run
evidence.

## Verification

- focused provider prompt copy/failure tests:
  `1 file / 4 tests`;
- shared provider-update filter/key/timeout tests:
  `11 tests`;
- complete workspace production build passed and staged Desktop assets;
- Lynx-for-Web deep prompt/relay/page-error probe passed;
- exact-owned Native DOM/style/screenshot/console/socket probe passed;
- Update all was not activated, so installed provider binaries were unchanged;
- no screenshots added; repository screenshot count remained `100`;
- temporary screenshots and DOM/style captures were removed after inspection;
- every failed browser/probe workflow was followed by a clean ownership gate.
