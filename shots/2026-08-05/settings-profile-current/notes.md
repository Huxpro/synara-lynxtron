# Settings Profile current-head evidence

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

## Identity

- Source base: `cfdd6db4`
- Lynx-for-Web bundle SHA-256:
  `f2bfbb9af5b8be33e9c3096a76721a541489d7201a1ad88ce9035f1a4e7b1c95`
- Native bundle SHA-256:
  `3112efe2859746a746a7142ee11533657c1cd09b63c9aa0a77aa401dda8c337a`
- SQLite online-backup snapshot SHA-256:
  `803ae581f62d065afa592fb16cdde7a6f5575d832bd1c1238658f612b6ac107d`
- Route: Settings Profile
- Theme: light
- Density: comfortable
- Browser viewport: `1280x820`, DPR 1
- Native outer window: `1280x820`
- Native LynxView frame: `2560x1576`, DPR 2

## Delivered parity

Before this slice, Profile was excluded from the Lynx Settings navigation and
had no renderer or stats transport.

The Lynx Profile now:

- calls the real `stats.getProfileStats` and `stats.getProfileTokenStats` RPCs;
- reuses the shared token/prompt heatmap, top-provider, and model-usage
  selectors;
- renders the local identity, five stat tiles, 274-cell activity heatmap with
  month labels, activity insights, plugin usage, and model usage;
- uses a real clipboard-backed `Copy summary` action;
- keeps the Web Profile's 720px content rail and omits the generic Settings
  panel header, matching Web's route-owned Profile composition;
- avoids `Intl` in the Native bundle because PrimJS cannot load the Web
  formatter module's top-level `Intl.NumberFormat` and `Intl.DateTimeFormat`.

## Geometry

Web / Lynx-for-Web / Native:

- profile rail: `x=408, y=32, width=720`;
- action rail: `720x28`;
- identity origin: `x=408, y=88`;
- avatar: `x=736, y=88, 64x64`;
- stats origin: Web `y=250`, Lynx `y=253`;
- Activity origin: Web `y=346`, Lynx `y=345`;
- Activity height: Web `168.55`, Lynx `168.5`, Native `169`;
- insights columns: Web `y=542.55`, Lynx `y=541.5`, Native `y=542`;
- insights columns height: `232` in all clients.

Every first-screen anchor is within 3px of Web. Native retained twelve required
roles, loaded the exact staged bundle through PID-derived
`localhost:8904/session 1`, and reported zero warning/error console messages.

## Capability boundary

Web's Edit dialog and image-export Share dialog depend on DOM file/image and
html-to-image capabilities. Lynx does not show inert replacements. It provides
the real clipboard summary action while keeping the rest of the dashboard
fully data-backed. Avatar image editing remains an explicit follow-up
capability rather than fabricated parity.

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
