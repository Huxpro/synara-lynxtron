# Automations Edit Relay Recovery

## Classification

- New scope: heartbeat Automation detail and Edit at `900x650`, dark.
- P1 product loss: `lynx-web-relay-open-state-misclassified`, `1.00 -> 0.00`.
- Harness loss: the first discovery used a stale Lynx-for-Web build and was
  invalidated before product attribution. The current bundle was rebuilt and
  independently reproduced the same offline state before the fix.
- Missing coverage: Native inline-edit parity remains open. This slice proves
  Native remained connected and unaffected by the Web-only relay change; it
  does not claim that the Lynx modal matches every Web inline field.

## Shared Fixture And Identity

The fixture was created through canonical product RPC, never by writing
SQLite:

- temporary thread command: `orchestration.dispatchCommand`,
  `thread.create`;
- disabled manual heartbeat Automation: `automation.create`;
- server instance:
  `cbfdb4e0-74c1-4df4-9d6c-7d6f358c6de1`;
- Automation:
  `automation:e449db20-be07-49c0-a7aa-5ada0f8f66c4`;
- initial and final max iterations: `250`;
- viewport: `900x650`, DPR `1`, dark;
- all retained PNGs: exactly `900x650`.

Web authority reached the detail through the real Automations list row.
Changing Max iterations `250 -> 100 -> 250` used the rendered select and
persisted both updates through `automation.update`.

## Product Loss

On the current pre-fix Lynx-for-Web bundle, the same route and fixture rendered
the complete read-only detail but showed `Synara is offline.` and removed
Edit/Delete:

- configured relay: `ws://127.0.0.1:58090`;
- connection attempts: `2`;
- active socket: `null`;
- ready socket: `null`;
- socket state: `null`;
- pending requests: `0`;
- transport and RPC diagnostics: `null`;
- page errors: empty.

A 100ms timeline showed successful connection attempts ending between
`200ms` and `300ms`, but no socket became the owned relay. A manual browser
implementation of the same bootstrap and feature protocol remained open for
three seconds and returned snapshot sequence `183`, excluding the server,
protocol negotiation, and browser network stack.

Bounded relay lifecycle diagnostics then proved the exact transition:

1. `connect-attempt`;
2. `feature-open`;
3. `connect-success`;
4. no `socket-owned`.

The only intervening branch compared `socket.readyState` with
`WebSocket.OPEN`. Lynx-for-Web can supply a compatible WebSocket constructor
whose instance follows the WHATWG numeric state protocol without preserving
constructor statics in the host bundle. A genuinely open socket was therefore
rejected and leaked.

## Fix

- Centralize the protocol value in `webSocketState.logic.ts`.
- Treat `readyState === 1` as open without relying on `WebSocket.OPEN`.
- Explicitly close a socket rejected during ownership transfer.
- Retain a bounded 80-event lifecycle ring in the existing relay diagnostics
  so future connection failures report the transition that failed.

After the fix:

- one connection attempt;
- `feature-open -> connect-success -> socket-owned`;
- active relay `ws://127.0.0.1:58090`;
- socket state `1`;
- no pending requests;
- no transport or RPC error;
- the unchanged Lynx Web WASM initialization deprecation warning remains
  accepted upstream noise;
- Edit/Delete/Resume visible;
- offline banner absent.

## Geometry And Remaining Scope

The restored Lynx Edit path was exercised with a real coordinate mouse click
derived from the rendered shadow DOM, not `element.click()`:

- Edit: `44.45x28 @ (716.03,8.5)`;
- dialog: `560x432 @ (170,109)`;
- panel: `526x312`, `scrollHeight=clientHeight=312`;
- footer: `526x32 @ (187,492)`;
- all Max iterations choices ended at `y=478`, above the footer.

The modal is reachable and no longer depends on broken scrolling. It still
contains only Name, Prompt, Stop when, and Max iterations, while Web authority
edits Repeats, Model, reasoning, Stop when, and Max iterations inline. That is
recorded as follow-up product scope rather than hidden by this connection fix.

## Verification

- relay focused Rstest: `4 files / 14 tests`;
- Lynx-for-Web production build passed;
- Web authority remained connected and persisted the mutation roundtrip;
- exact Native PID `51253`, PID-derived client `localhost:8902/session 1`;
- Native warning/error console empty;
- Desktop bundle must remain free of Web-only relay markers;
- every browser workflow ran under `browser:run`;
- every failed locator/probe was followed by `browser:gate`;
- final local screenshot count: `100`.

## Evidence

- `web/raw.png`: Web authority inline detail.
- `lynx-before/raw.png`: current pre-fix Lynx-for-Web offline detail.
- `lynx-after/raw.png`: current fixed Lynx-for-Web connected detail.
- `geometry.json`: comparable geometry and relay transitions.
- `console.json`: retained console/error classification.
