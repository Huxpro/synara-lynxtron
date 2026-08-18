# Native Landing Send Nullable Payload Recovery

## Classification

- Product reliability loss: Native landing send could not create its thread.
- External provider state: the accepted Codex turn later failed because the
  account reported a usage limit. This is not a transport, dispatch, or Lynx
  rendering failure.

## Root cause

The landing composer constructed a valid `thread.create` command with
`branch: null` and `worktreePath: null`. The Lynx Native bridge omitted those
null-valued properties before the command reached the Node host. The server
schema correctly rejected the incomplete payload:

`Missing key at ["branch"]`

The fix normalizes bridge-originated `orchestration.dispatchCommand` payloads
at the Desktop and Lynx-for-Web host boundary. For `thread.create`, absent
required nullable fields are restored before the WebSocket request is sent.
Explicit non-null branch and worktree values are preserved.

## Native verification

- Server instance: `c7fea750-6510-4770-a0ca-c78804443bb8`.
- Exact-owned Native PID after the fix: `60122`.
- PID-derived DevTool client: `localhost:8902`, session `1`.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Product socket: one established connection from PID `60122` to
  `127.0.0.1:58090`.
- The persisted landing draft contained `hi`, model `gpt-5.6-luna`, and
  reasoning effort `low` before the real rendered Send control was tapped.
- The host accepted the canonical sequence:
  - `orchestration.dispatchCommand` / `thread.create`;
  - `orchestration.dispatchCommand` / `thread.turn.start`.
- The renderer navigated to
  `/thread/lynx-landing-thread-1787038961366-4541af01c9c728`.
- Canonical read RPC confirmed the new thread contains the user message `hi`.
- The draft became empty only after both dispatches succeeded.
- Fresh exact-client warning/error console was empty after the successful
  send.

The provider then opened a real Codex app-server thread and returned:

`You've hit your usage limit.`

The resulting turn state is `error`, but the thread creation, message
persistence, route transition, and provider dispatch all succeeded. This
external account limit is retained as environment evidence rather than being
misclassified as a Synara send failure.

## Verification

- Focused tests: `2 files / 8 tests`.
- Lynx/Desktop production build: passed with the existing registered build
  warnings.
- Entry/failure/exit browser ownership gates reported `sessions: []` and zero
  agent-browser-owned processes.
- No repository screenshot was retained; local screenshot count was not
  increased.
