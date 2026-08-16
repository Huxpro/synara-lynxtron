# Live system appearance synchronization

## Newly discovered interaction

This loop extended the static system-dark cell into a live host interaction:

- Appearance Settings;
- theme mode `system`;
- compact `390x844`, DPR `1`;
- one long-lived Web authority session;
- one long-lived Lynx-for-Web session;
- host appearance changed dark -> light without reload;
- repaired path also changed light -> dark without reload.

## Comparable identity

Both clients used the same isolated server at `ws://127.0.0.1:58090`, the
same empty snapshot, the same `localhost:8891` trusted origin, and
`/settings/appearance`.

Lynx relay diagnostics stayed connected with:

- connection attempts `1`;
- socket state `1`;
- pending requests `0`;
- no transport/RPC error.

## P1 product loss

Before the fix:

1. Both clients started dark and showed the current dark slot.
2. `agent-browser set media light` changed the same browser sessions' real
   `(prefers-color-scheme: dark)` result to false.
3. Web authority immediately changed to light and showed the current light
   slot.
4. Lynx-for-Web still rendered a dark root, dark Settings page, and current
   dark slot despite its host media query being false.

The Web host sampled `matchMedia(...).matches` only once for init data and
never published later changes.

`lynx-live-system-appearance-drift`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

A shared host/renderer contract now owns:

`synara:system-appearance`

The Web host:

- keeps one `MediaQueryList`;
- sends `event.matches` through the existing Lynx global-event channel;
- removes the media listener on `pagehide`.

`App`:

- stores the initial host value as state;
- subscribes through the existing `onGlobalEvent` bridge;
- accepts only boolean payloads;
- updates the same `systemDark` owner used by root variables, root class,
  `useTheme`, `SliceRouter`, and Settings.

Native behavior is unchanged. Without a reliable native appearance event,
system mode retains its documented light fallback.

## After evidence

In one fresh Lynx-for-Web session:

- initial dark: root/page/current slot all dark;
- live light: root/page/current slot all light;
- live restored dark: root/page/current slot all dark;
- no reload occurred;
- relay connection attempts remained `1`;
- socket stayed open;
- page errors remained empty.

## Verification and cleanup

- Focused event/theme/Web-host suites: `3` files / `24` tests.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Output/staged Native bundle SHA-256:
  `3ba6c39573b90e9cd9a4a1c60ff3f6cb55e283e7a7b2f9dd13b1f1cd05fb07a5`.
- Browser entry cleanup passed.
- Every browser command ran through `browser:run`.
- Exit returned `sessions: []` and zero agent-browser-owned processes.
- No screenshot was retained; local count remained `100`.
- Owned server/Web processes and temporary state/stage were removed.
- A transient unrelated listener briefly occupied `8902` after owned cleanup,
  then exited on its own. It was not treated as owned and was not terminated.
