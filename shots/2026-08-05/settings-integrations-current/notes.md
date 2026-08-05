# Settings Integrations current-head evidence

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

## Identity

- Source base: `52d55bf7`
- Lynx-for-Web bundle SHA-256:
  `f2bfbb9af5b8be33e9c3096a76721a541489d7201a1ad88ce9035f1a4e7b1c95`
- Native bundle SHA-256:
  `3112efe2859746a746a7142ee11533657c1cd09b63c9aa0a77aa401dda8c337a`
- SQLite snapshot SHA-256:
  `803ae581f62d065afa592fb16cdde7a6f5575d832bd1c1238658f612b6ac107d`
- Route: Settings Integrations
- Theme: light
- Density: comfortable
- State: no connected agents
- Browser viewport: `1280x820`, DPR 1
- Native outer window: `1280x820`
- Native LynxView frame: `2560x1576`, DPR 2

## Delivered parity

The Lynx Integrations panel now:

- lists integrations through `server.listExternalMcpIntegrations`;
- provides the real connection name, all-project/selected-project scope,
  project picker, safe default capabilities, and opt-in advanced permissions;
- creates 30-day credentials through `server.createExternalMcpIntegration`;
- builds and copies a self-contained setup prompt from the canonical server
  pairing command and stdio configuration;
- supports Continue/Resume pairing and Revoke through the canonical RPCs;
- renders active, paired, connected, expired, and revoked states with project
  and permission summaries;
- never fabricates a credential or setup state in the renderer.

No connection was created, refreshed, revoked, or copied during retained
evidence capture.

## Geometry

Web / Lynx-for-Web / Native:

- content rail: `x=432, y=0, width=672`;
- header: `x=456, y=32, width=624, height=54`;
- four form rows: Web/Lynx `x=457`, heights `79`; Native first row
  `x=457, y=150, 622x79`;
- name input: Lynx `x=811, y=173, 256x32`; Native
  `x=811, y=174, 256x32`;
- connected-agents empty row: Web `x=457, y=524, 622x58`; Lynx
  `x=457, y=525, 622x58`; Native `x=457, y=522, 622x58`.

The first implementation used generic 72px form rows and a 92px empty row.
Measurements assigned both residuals to Integrations-owned row recipes; named
79px form rows and a 58px empty/setup row close the cumulative drift without
changing global Settings primitives.

## Runtime and capability proof

- Focused tests cover safe capability defaults, status transitions, project
  and permission descriptions, setup-prompt generation, all four RPCs,
  clipboard wiring, and form anatomy.
- Exact-owned Native retained the real name input, enabled all-project switch,
  empty connection row, and complete `bindtap`/accessibility contracts.
- Native capture used PID `50924`, PID-derived `localhost:8904/session 1`,
  eight required roles, and zero warning/error console messages.
- Lynx-for-Web used the staged current-head bundle and kept its host URL under
  `/lynx/index.html`; its sole warning is the upstream web-core deprecated
  initialization signature.

## State cleanup

The Native light-theme capture temporarily changed only the owned
`.p10-view-native` KV file. The app was stopped before restoration, and the
original bytes were restored with SHA-256
`f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.

## Frozen snapshot refresh

This cell was recaptured from current head while the owned Synara server was
paused after Web, Lynx-for-Web, and Native synchronized the light theme. All
three clients therefore reference the same SQLite online-backup snapshot
`803ae581f62d065afa592fb16cdde7a6f5575d832bd1c1238658f612b6ac107d`. Web reconnect warnings during the deliberate freeze are harness
evidence; no page error was retained, Lynx-for-Web had a clean console, and the
PID-owned Native console was empty.
