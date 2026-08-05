# Settings Archived current-head evidence

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

## Identity

- Source base: `5f827e77`
- Lynx-for-Web bundle SHA-256:
  `f2bfbb9af5b8be33e9c3096a76721a541489d7201a1ad88ce9035f1a4e7b1c95`
- Native bundle SHA-256:
  `3112efe2859746a746a7142ee11533657c1cd09b63c9aa0a77aa401dda8c337a`
- SQLite snapshot SHA-256:
  `803ae581f62d065afa592fb16cdde7a6f5575d832bd1c1238658f612b6ac107d`
- Route: Settings Archived
- Theme: light
- Density: comfortable
- State: canonical empty archived-thread projection
- Browser viewport: `1280x820`, DPR 1
- Native outer window: `1280x820`
- Native LynxView frame: `2560x1576`, DPR 2

## Delivered parity

Before this slice, Archived was excluded from the Lynx Settings navigation and
had no renderer or mutation path.

The Lynx Archived panel now:

- projects archived shells from the canonical sidebar snapshot without
  changing the active sidebar-thread contract;
- groups threads in project order, appends orphaned threads under
  `Unknown project`, and sorts by
  `archivedAt ?? updatedAt ?? createdAt` descending;
- renders Web's empty-state icon, title, and explanatory copy;
- dispatches the real `thread.unarchive` command and invalidates the shared
  sidebar snapshot after success;
- preserves the actual transport error in the retry state instead of hiding
  failures behind generic copy;
- intentionally omits Delete until the Native confirmation and permanent
  deletion capability exists, rather than exposing an inert destructive
  action.

## Geometry

Web / Native:

- content rail: `x=432, y=0, width=672`;
- header: `x=456, y=32, width=624, height=54`;
- empty card: Web `x=456, y=118, 624x182`; Native
  `x=456, y=118, 624x178`;
- Native icon shell: `44x44`;
- Native title: `117x18`;
- Native description: `390x18`.

The content and header anchors match exactly. The empty card differs by 4px in
height while preserving the same origin, width, centered icon, title, and
description.

## Harness findings

The first Native diagnostic correctly surfaced
`Synara is offline; reconnect cooling down`. Native's background VM receives
`SYNARA_WS_URL` at build time, not from the desktop process environment, so the
retained bundle was rebuilt with
`SYNARA_WS_URL=ws://127.0.0.1:60462`. This was a harness correction, not a
product-state workaround.

The final exact-owned Native capture used PID `97417`, its PID-derived
`localhost:8904/session 1`, retained all seven required roles, and reported zero
warning/error console messages.

The retained Lynx-for-Web console contains only the upstream web-core deprecated initialization warning; the target state has no RPC or product runtime errors.

## State cleanup

The Native light-theme capture temporarily changed only the owned
`.p10-view-native` KV file. The app was stopped before restoration, and the
original bytes were restored with SHA-256
`f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.

## Lynx-for-Web correction

An earlier browser capture had hit Vite's SPA fallback instead of the generated Lynx-for-Web host because the staged `/lynx` assets were missing. That evidence was invalidated. The retained frame uses the staged current-head bundle, keeps the host URL under `/lynx/index.html`, and verifies the target `X-VIEW` class after memory-history navigation.

## Frozen snapshot refresh

This cell was recaptured from current head while the owned Synara server was
paused after Web, Lynx-for-Web, and Native synchronized the light theme. All
three clients therefore reference the same SQLite online-backup snapshot
`803ae581f62d065afa592fb16cdde7a6f5575d832bd1c1238658f612b6ac107d`. Web reconnect warnings during the deliberate freeze are harness
evidence; no page error was retained, Lynx-for-Web had a clean console, and the
PID-owned Native console was empty.
