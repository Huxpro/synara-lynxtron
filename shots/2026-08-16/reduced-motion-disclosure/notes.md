# Reduced-motion disclosure cleanup

## Newly discovered interaction

This loop added a reduced-motion timing cell that the earlier visual matrix did
not cover:

- compact `390x844`, DPR `1`;
- Providers with OpenCode disclosure;
- Web authority and Lynx-for-Web on one isolated server/origin;
- `prefers-reduced-motion: reduce`;
- open, close first probe, close at `80ms`, and close at `320ms`;
- live no-preference -> reduce change before closing.

## Comparable identity

Both clients used:

- `ws://127.0.0.1:58090`;
- `http://localhost:8891`;
- the same empty isolated snapshot;
- `/settings/providers`;
- the same rendered OpenCode control;
- real integer pointer events.

Every browser command ran through `browser:run`; page errors were empty.

## P1 product loss

The shared CSS already reduces disclosure transitions to effectively zero.
Web authority therefore collapsed OpenCode immediately:

- closed content absent on the first probe;
- row height `44px`.

Before the fix, Lynx still used the JavaScript presence timer:

- first closed probe: content present, row `483px`;
- `80ms`: content present, row `483px`;
- only after `320ms`: content absent, row `44px`.

Reduced-motion users still experienced a fixed `220ms + 40ms` layout delay
despite the visual transition being disabled.

`lynx-reduced-motion-presence-delay`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

The Web host now owns one reduced-motion media query and publishes:

`synara:reduced-motion`

through the existing global-event bridge. It passes the initial value through
init data, sends live changes, and removes its listener on pagehide.

`App` stores the preference, validates boolean event payloads, and publishes it
to the shared Lynx motion module. `useLynxDisclosurePresence` now removes
closed content immediately when reduced motion is active; ordinary Native and
Web-host no-preference paths retain the canonical `220ms + 40ms` exit.

The shared owner covers Provider, Sidebar, PR, Explorer, Environment,
Integrations, Advanced, and model-group disclosures without per-component
flags.

## After evidence

With reduced motion active from startup:

- Lynx close first probe: content absent, row `44px`;
- `80ms`: content absent, row `44px`;
- `320ms`: content absent, row `44px`.

With a live preference change:

1. no-preference OpenCode opened at `483px`;
2. the same session changed to reduced motion without reload;
3. the same rendered trigger closed;
4. content was absent and row was `44px` on the immediate probe;
5. relay connection attempts remained `1`.

## Verification and cleanup

- Focused reduced-motion/event/Web-host suites: `3` files / `21` tests.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Output/staged Native bundle SHA-256:
  `0ff05243b2eb35ef838091e01b89e6001afb2a7561d9c7b7a9b78539aeca0114`.
- Browser entry and exit cleanup passed.
- Exit returned `sessions: []` and zero agent-browser-owned processes.
- No screenshot was retained; local count remained `100`.
- Owned server/Web processes and temporary state/stage were removed.
