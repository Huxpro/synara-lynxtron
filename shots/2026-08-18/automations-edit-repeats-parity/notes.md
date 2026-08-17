# Automations Edit Repeats Parity

## Classification

- New scope: heartbeat Automation detail and Edit at `900x650`, dark.
- P1 product loss: `lynx-automation-edit-repeats-missing`, `1.00 -> 0.00`.
- Harness failures: one shell quoting failure, one repeated top-level DevTool
  evaluation declaration, and two background system-mouse misses. Every failed
  loop stopped and passed `browser:gate` before retry. None changed product
  state or was relabeled as product loss.
- Intentional delta: this focused Lynx editor exposes Manual, Daily, and
  Weekdays. Web retains its broader Once, Hourly, Weekly, Custom, and Cron
  editor. The reduced set is explicit rather than hidden.

## Shared Fixture

The fixture was created through canonical product RPC:

- server instance:
  `cbfdb4e0-74c1-4df4-9d6c-7d6f358c6de1`;
- Automation:
  `automation:1d3dcca6-6466-4489-9208-2bd2dbacab36`;
- source thread:
  `ab3ff11c-3f4c-4a31-b25f-98f5b1878ec6`;
- initial and final schedule: `{"type":"manual"}`;
- timed transition:
  `{"type":"weekdays","timeOfDay":"09:00"}`.

SQLite was read only to verify the server projection after rendered UI
mutations. No fixture state was written directly.

## Product Fix

The Lynx Edit modal now:

- owns schedule state alongside Name, Prompt, Stop when, and Max iterations;
- presents Manual, Daily, and Weekdays using the existing shared choice UI;
- defaults Manual-to-timed transitions to `09:00`;
- preserves `timeOfDay` and `timezone` across Daily and Weekdays;
- includes schedule in dirty-state and update payloads only when it changed.

## Web And Lynx-for-Web

Both clients used the same server, route, fixture, dark theme, and
`900x650` DPR 1 viewport.

Web authority initially showed Repeats as Manual. Lynx-for-Web opened Edit
through a real coordinate mouse click derived from rendered shadow-DOM
geometry. Its modal exposed:

- Repeats label at `y=401`;
- Manual `58.78x26 @ (187,421)`;
- Daily `45.86x26 @ (251.78,421)`;
- Weekdays `75.34x26 @ (303.64,421)`;
- Save `53.73x32 @ (659.27,523)`.

The rendered UI completed `Manual -> Weekdays -> Manual`. A separately
reloaded Web authority read Weekdays after the first save and Manual after the
second. Lynx-for-Web recorded two `automation.update` calls.

Relay diagnostics remained healthy:

- one connection attempt;
- `feature-open -> connect-success -> socket-owned`;
- socket state `1`;
- zero pending requests;
- no transport or RPC error;
- browser page errors empty.

## Exact Native

The prior owned Native process was stopped and replaced with:

- PID `84735`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- production session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `a9102ce117eae5807b92bdc9bdba80044f90b2e283c81bc97101959625b8a4c0`;
- one established socket to `127.0.0.1:58090`;
- direct startup route for the same Automation.

Native DevTool DOM proved the current production modal contained Repeats and
all three choices. Exact-session `Input.emulateTouchFromMouseEvent` press and
release events drove the real Native Lynx `bindtap` pipeline without raising
the background window:

1. Manual was initially `Selected`.
2. Weekdays became `Selected` and Save became enabled.
3. Save closed the modal.
4. Read-only SQLite returned
   `{"type":"weekdays","timeOfDay":"09:00"}`.
5. Reopening Edit showed Weekdays selected.
6. Manual became selected, Save enabled, and the second save restored
   `{"type":"manual"}`.

Fresh exact-client warning/error console output was empty. Background system
mouse clicks were rejected as harness misses because `showInactive()` did not
make the window frontmost; no Native system-mouse claim is made.

## Verification

- focused Automation tests: `2 files / 17 tests`;
- root `bun typecheck`: `7/7`;
- Web and Native/Desktop production builds passed;
- fixture restored to Manual;
- final browser gate: `sessions: []` and zero agent-browser-owned processes;
- no screenshots added; repository screenshot count remained `100`.
