# Task Completion Summary Fidelity

## New Scope

- off-screen chat completion notification body;
- canonical final assistant message selection;
- same-turn fallback and 140-character normalization;
- shell-poll completion detection followed by on-demand detail loading;
- concurrent completion batches, slow detail RPC, failed detail RPC, and
  attention/completion coalescing;
- Web authority, Lynx-for-Web production bundle, and exact-owned Native
  production bundle.

This extends the preceding native-system-notifications scope. That slice
restored the OS delivery channel; this slice audits the content delivered
through that channel.

## Product Loss

Web original uses the completed turn's final assistant reply as the completion
toast and OS notification body. It prefers `latestTurn.assistantMessageId`,
falls back to the last non-empty assistant message from the same turn, normalizes
whitespace, and caps the body at 140 characters.

Lynx only had the shell snapshot when it detected completion, so it always sent:

`Finished working.`

The final provider outcome was therefore absent from both the in-app toast and
the newly restored Native OS notification. This was a P2 content fidelity loss:
the notification channel worked, but conveyed less useful information than the
original product.

## Fix

- Extracted `summarizeTaskCompletionAssistantMessage` as the shared Web/Lynx
  authority for canonical message selection and normalization.
- Kept the five-second shell snapshot as the cheap completion detector.
- Added one detail RPC only after a fresh `thread-completion` transition.
- Approval/user-input and terminal notifications never wait for a detail RPC.
- A completion immediately renders the existing `Finished working.` fallback;
  the body is enriched when the detail result arrives.
- Detail failure or an empty assistant reply preserves the fallback.
- Every completion in a same-snapshot batch resolves independently.
- A later shell poll no longer cancels a slow detail resolution and lose its OS
  delivery.
- Only the latest completion batch may replace the single in-app toast; every
  batch still retains its independent system-notification delivery.
- Settings are re-read after detail resolution so a user toggle made during the
  RPC is respected.

## Verification

- Web completion logic: `17/17`;
- Lynx completion detector/resolver/host: `17/17`;
- Web production build: passed;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- staged Native bundle SHA-256:
  `7b9204dff717c3eedd2d89be78b3348700eed90d1835ac1a8d0204b13fde3ef2`;
- Lynx-for-Web bundle SHA-256:
  `8830e0c34ab5f199a7512319fa4297b1142fa5978d2ec4586193b232a5aae918`;
- exact-owned Native PID: `15627`;
- PID-derived DevTool client: `localhost:8902`, session `1`;
- loaded bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`;
- exact-client error/warning console: empty;
- local screenshot count remained `100`.

## Native Behavior Harness

A canonical real-provider cell was attempted without direct SQLite mutation:

- temporary threads were created through `thread.create`;
- turns were submitted through `thread.turn.start`;
- the server accepted the commands and opened authenticated Codex app-server
  sessions for both `gpt-5.6-luna` and `gpt-5.6-terra`;
- server log evidence recorded the corresponding `thread/start` resolutions.

The isolated server did not project a `latestTurn` or assistant message within
the 120-second evidence window. Each temporary thread was stopped and deleted
through canonical orchestration commands.

This is retained as a provider/harness-state failure, not a product regression
and not passing Native behavior evidence. No screenshot was retained from the
incomplete state. The product conclusion rests on the shared outcome contract,
focused race/failure coverage, production bundle verification, and exact-client
runtime/console correlation.

## Classification

- Generic Native completion body instead of final assistant result: P2 product
  content loss, closed.
- Slow detail result canceled by the next shell poll: P1 product reliability
  loss discovered during implementation review, closed.
- Attention notifications delayed behind completion detail: P1 product
  responsiveness loss discovered during implementation review, closed.
- Real Codex lifecycle not projected in the isolated evidence window: harness
  failure; not counted as product loss.
- Existing visual toast anatomy: accepted unchanged rendering; no new screenshot
  was needed.
