# Settings Advanced current-head evidence

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

## Identity

- Source base: `1dee54c0`
- Lynx-for-Web bundle SHA-256:
  `f2bfbb9af5b8be33e9c3096a76721a541489d7201a1ad88ce9035f1a4e7b1c95`
- Native bundle SHA-256:
  `3112efe2859746a746a7142ee11533657c1cd09b63c9aa0a77aa401dda8c337a`
- SQLite snapshot SHA-256:
  `803ae581f62d065afa592fb16cdde7a6f5575d832bd1c1238658f612b6ac107d`
- Route: Settings Advanced
- Theme: light
- Density: comfortable
- State: recovery tools visible
- Browser viewport: `1280x820`, DPR 1
- Native outer window: `1280x820`
- Native LynxView frame: `2560x1576`, DPR 2

## Delivered parity

Before this slice, Advanced was excluded from Lynx Settings.

The Lynx Advanced panel now:

- reads the canonical server config and exposes the real persisted
  `keybindings.json` path;
- selects the first editor from the shared product editor ordering and calls
  the real `shell.openInEditor` RPC;
- derives recovery eligibility from hydrated projects, thread shells, and
  message presence;
- uses the host confirmation dialog and real `orchestration.repairState` RPC,
  then invalidates the sidebar projection;
- injects the Lynx package version from the build config instead of hardcoding
  page copy;
- omits the Web Release history button because its dialog composition has not
  been ported, rather than exposing an inert action.

## Geometry

Web / Lynx-for-Web / Native:

- content rail: `x=432, y=0, width=672`;
- header: `x=456, y=32, width=624, height=54`;
- keybindings row: Web `x=457, y=151, 622x104`; Lynx/Native
  `x=457, y=150, 622x104`;
- Native recovery detail: `x=469, y=355, 490x84`;
- Native version: `72x18`.

The keybindings row initially measured 4px short. The residual owner was the
keybindings row itself, so a named `SettingsAdvancedRow--keybindings` minimum
height closed it without changing global Settings primitives.

## Capability boundaries

Web displays product version `0.5.5`; the Lynx package reports
`0.5.5-lynx.0`. This is an intentional package-version delta, not hidden copy.
Release history remains an explicit follow-up until its real dialog/changelog
composition is available in Lynx.

No Open file or Repair action was activated during evidence capture. Their
host/RPC wiring and conditional eligibility are covered by focused tests.

The final exact-owned Native capture used PID `73880`, its PID-derived
`localhost:8904/session 1`, retained all seven required roles, and reported zero
warning/error console messages.

## Harness correction

The first Settings browser captures had accidentally hit Vite's SPA fallback:
`/lynx/index.html` returned the Web original because the Lynx-for-Web assets had
not been staged. Those captures were invalidated. The retained Lynx cells use
the staged current-head bundle, keep the host URL under `/lynx/index.html`, and
verify target `X-VIEW` classes after memory-history navigation.

The only retained Lynx-for-Web console warning is the upstream web-core
deprecated initialization signature. There are no RPC or product runtime
errors.

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
