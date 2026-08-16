# Plugin Library header at 320px

## Newly discovered scope

This loop added a narrower header interaction than the existing 390px compact
Skills/search matrix:

- `320x650`, DPR `1`;
- Plugin Library route;
- Plugins/Skills tabs;
- all nine provider choices;
- horizontal provider-strip reachability;
- exact hit testing against desktop titlebar controls;
- exact-owned Native `900x650` regression boundary.

## Comparable identity

Web authority and Lynx-for-Web used the same isolated server at
`ws://127.0.0.1:58090`, the same empty snapshot, trusted
`http://localhost:8891`, and `/plugins`.

Codex plugin discovery returned the real environment error that `codex` was
not in PATH. It is an environment capability boundary, not the header loss.

## P1 product loss

Before the fix, the compact Plugin header stayed one row:

- Plugins center `x=44`;
- Skills center `x=102`;
- provider strip `x=138..304`, only `166px` wide.

The fixed closed-sidebar desktop titlebar controls occupied `x=90..174`.
Shadow-root `elementFromPoint` at the Skills center returned
`DesktopTitlebarControlIcon`, not Skills. A real pointer press/release did not
change the selected tab.

The identical 1280px path hit the Skills text and selected Skills. This
separated a compact product hit-target loss from generic Web Core pointer
failure.

`lynx-plugin-320-tab-titlebar-overlap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

The compact header now has two explicit rows:

1. a 46px tab row inset to `x=180`, past the measured titlebar controls;
2. a 46px provider row using the full viewport width.

Medium and wide layouts retain the original single 46px row. The change uses
an explicit `PluginLibraryTabs` owner rather than structural pseudo-selectors.

## After evidence

At 320px after rebuilding:

- header `320x92`;
- Plugins `64.38x28 @ x=180`;
- Skills `52.55x28 @ x=250.38`;
- Skills center hit its own raw text;
- real pointer activation selected Skills;
- provider strip expanded from `166px` to `320px`;
- horizontal content width `578px`;
- far-end scroll left `258px` exposed Pi fully at `x=270.89..303.80`.

No route, transport, or page error occurred beyond the explicit Codex missing
CLI discovery result.

## Native regression boundary

Exact-owned Native used:

- PID `78655`;
- PID-derived `localhost:8902/session 1`;
- exact staged production bundle;
- `900x650`, medium viewport.

Native retained the original `644x46` single-row header. A real
`Input.emulateTouchFromMouseEvent` on Skills selected the tab and issued
`provider.listSkills`. The exact-client warning/error console was empty.

## Harness classifications

- A Pi click followed immediately by a Skills click happened before the new
  capability state settled and did not issue the resource query. That sample
  was rejected as interaction timing setup.
- The Lynx accessibility snapshot exposed only the search textbox, so an
  attempted tab ref lookup failed before interaction. It was recorded as a
  harness/accessibility gap, not the product hit-target proof.
- A later settled Pi sample confirmed the Skills button was not disabled; the
  retained loss instead uses exact hit testing plus the 1280 control.

## Verification and cleanup

- Focused Plugin suite: `1` file / `3` tests.
- Expanded Plugin/shell/settings suites: `3` files / `28` tests.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Output/staged Native bundle SHA-256:
  `063c487d08768d22c6052bcc295731d80ee62fe8fa78e69ab2e4bdec9edffef9`.
- Browser entry/exit cleanup passed.
- Exit returned `sessions: []` and zero agent-browser-owned processes.
- No screenshot was retained; local count remained `100`.
- Owned server/Web/Native processes and temporary state/stage were removed.
