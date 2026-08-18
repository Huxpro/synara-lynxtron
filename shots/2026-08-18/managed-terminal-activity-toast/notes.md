# Managed Terminal Activity Toast

## Classification

- Product loss: Lynx did not surface off-screen managed terminal completion or
  attention transitions.
- Harness loss: early Native probes wrote a literal `\r` instead of a carriage
  return, so the PTY command never executed. Those negative results were
  rejected.
- Accepted environment limitation: the currently selected Codex account later
  reported a usage limit; this is unrelated to terminal activity delivery.

## Implementation

- Reuse the existing root-owned `TaskCompletionToastHost`.
- Subscribe once to the canonical `terminal.subscribeEvents` stream.
- Route stream chunks by RPC tag in both Desktop and Lynx-for-Web hosts.
- Do not retain chunks from the infinite terminal stream in host arrays.
- Keep one module-global stream owner with listener fanout and bounded retry
  only while listeners remain.
- Project terminal `running`, `attention`, and `review` transitions through the
  shared Web notification copy.
- Suppress terminal notifications for the currently visible thread.
- Project Native GlobalEvent activity directly into a TanStack Query cache
  snapshot. The component renders the projected toast from that cache, avoiding
  an unsupported nested state update inside the native event callback.

## Canonical fixture

The retained verification used product RPCs only:

1. create a temporary thread through `orchestration.dispatchCommand`;
2. open a real PTY through `terminal.open`;
3. write the official managed-agent OSC hooks:
   - `633;SYNARA_AGENT_EVENT=Start`;
   - `633;SYNARA_AGENT_EVENT=Stop`;
4. observe the real `terminal.subscribeEvents` stream;
5. close the terminal with history deletion;
6. permanently delete the temporary thread.

No SQLite fixture writes were used.

## Lynx-for-Web result

- Real event sequence: `running -> review`.
- Rendered copy:
  - `Terminal task completed`;
  - `Terminal finished working.`
- `terminal.subscribeEvents` request count: `1`.
- One expected infinite pending stream.
- No transport or RPC error.

## Native result

- Server instance: `c7fea750-6510-4770-a0ca-c78804443bb8`.
- Exact-owned final Native PID: `72140`.
- PID-derived DevTool client: `localhost:8902`, session `1`.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Real event sequence:
  - `running` at `2026-08-18T08:17:08.107Z`;
  - `review` at `2026-08-18T08:17:12.126Z`.
- A capture launched from the same review-event callback showed:
  - `Terminal task completed`;
  - `Terminal finished working.`;
  - `Open`;
  - dismiss action.
- The terminal toast stacked above the simultaneous provider update prompt.
- One established product socket to `127.0.0.1:58090`.
- Exact-client warning/error console was empty.
- Diagnostic runs confirmed Lynxtron accepted both `running` and `review`
  GlobalEvents; the final product build does not retain per-event debug logs.

## Cleanup

- Temporary thread:
  `554e3682-c0d1-4f65-bf98-076f4577aaef`.
- Final shell snapshot: `exists: false`, sequence `252`.
- The one-off fixture script and temporary screenshots were removed.
- Repository screenshot count remained `100`.
- Browser ownership gate returned `sessions: []` and zero
  agent-browser-owned processes.

## Verification

- Focused tests: `3 files / 16 tests`.
- Lynx/Desktop production build: passed with the existing registered warnings.
- Earlier Lynx-for-Web production build passed for the same stream routing.
- No upstream issue was filed: the stream, Lynxtron GlobalEvent delivery, and
  connection remained healthy. The observed failures were local projection and
  harness timing defects.
