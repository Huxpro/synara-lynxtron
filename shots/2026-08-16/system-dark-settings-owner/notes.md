# System-dark Settings theme ownership

## Newly discovered scope

This loop added a previously unverified combination:

- Appearance Settings;
- theme mode `system`;
- host dark appearance;
- compact `390x844`, DPR `1`;
- Web authority and Lynx-for-Web on one trusted origin and one isolated server.

The existing matrix covered explicit light/dark modes. It did not prove the
system-mode host signal reached both the root theme and the Settings-local
Appearance composition.

## Comparable identity

Both renderers used:

- server `ws://127.0.0.1:58090`;
- trusted origin `http://localhost:8891`;
- the same empty isolated snapshot;
- route `/settings/appearance`;
- `390x844`, DPR `1`;
- dark media with persisted/default `system` mode.

Lynx relay diagnostics reported the configured and active `58090` endpoint,
socket state `1`, renderer-ready `/settings/appearance`, no pending request,
and no transport/RPC error. Browser page errors were empty.

## P1 product loss

Web authority resolved:

- HTML theme mode `system`;
- active variant `dark`;
- visible copy `System is currently using this dark slot.`

Before the fix, Lynx-for-Web resolved:

- root `SliceRoot--theme-dark`;
- Settings `SettingsPage--theme-light`;
- visible copy `System is currently using this light slot.`

The canvas was dark but the Appearance editor told users the light theme slot
was active. Editing the displayed “current” pack could therefore target the
wrong conceptual slot.

`lynx-settings-system-dark-owner-drift`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

`App` already resolves the canonical variant with the host `systemDark`
signal and passes it into `SliceRouter`. `SettingsPage` discarded that value
and independently called `resolveSliceThemeVariant(themeState)` without the
host signal, which intentionally defaults system mode to light.

The fix makes the resolved variant single-source:

`App -> SliceRouter.resolvedTheme -> SettingsPage.resolvedTheme`

Settings no longer performs a second host-blind resolution.

## After evidence

On the same cell after rebuilding:

- Web remained `system` / `dark` and showed current dark slot;
- Lynx root remained `SliceRoot--theme-dark`;
- Lynx Settings changed to `SettingsPage--theme-dark`;
- Lynx visible copy changed to
  `System is currently using this dark slot.`;
- no light-slot current marker remained;
- relay and page-error gates stayed clean.

Native currently lacks a reliable system appearance event by documented
design. In Native system mode, the root and Settings continue to share the
same documented light fallback. This is an intentional host capability
boundary, not evidence against the Web-host system-dark fix.

## Verification and cleanup

- Focused theme test: `1` file / `6` tests.
- Expanded theme/navigation/Web-host suites: `3` files / `33` tests.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Output/staged Native bundle SHA-256:
  `7c0e8f4672111b4538670943f81c0e3bc1b80ff167b1640c20d1de4e5931ce4c`.
- Browser entry cleanup passed.
- Browser exit returned `sessions: []`.
- Exit cleanup reported zero agent-browser-owned processes.
- No browser screenshot was retained; local screenshot count remained `100`.
- Owned ports `58090`, `8891`, and `8902` were free.
- Temporary browser stage and isolated server state were removed.
