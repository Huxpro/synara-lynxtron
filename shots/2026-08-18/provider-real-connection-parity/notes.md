# Provider Real Connection Parity

## Scope

- providers: Codex and Claude Code;
- clients: Web authority, Lynx-for-Web, exact-owned Native;
- state: installed CLI, canonical provider health, authenticated account,
  provider/model picker, real first turn, explicit stop, restart/resume, and
  terminal provider failure;
- theme/viewport: dark, `1280x820`, DPR `1` for browser clients; Native
  `1280x820` outer / `2560x1640` physical capture;
- server: isolated `127.0.0.1:58090`, state directory `.synara-sxs/dev`.

No provider fixture, fake authentication, direct SQLite mutation, or
renderer-specific provider decision was used.

## Provider Identity

Canonical `server.getConfig` after refresh:

- Codex:
  - available: true;
  - auth: authenticated through ChatGPT;
  - status: ready;
  - version: `0.147.0-alpha.6.5`.
- Claude:
  - available: true;
  - auth: authenticated;
  - subscription: `Claude Max Subscription`;
  - status: ready;
  - version: `2.1.226`.

The direct CLIs independently reported:

- `codex login status`: `Logged in using ChatGPT`;
- `claude auth status`: `loggedIn:true`, `authMethod:claude.ai`,
  `subscriptionType:max`.

Final direct provider execution also matched Synara:

- official `codex exec -s read-only` failed with the same usage-limit text and
  the same `Aug 20th, 2026 12:29 PM` reset time;
- official `claude -p` returned exactly `DIRECT_CLAUDE_OK`.

This rules out a Synara-specific Codex environment, model, or transport
failure and independently proves the recovered Claude account can execute.

Claude was genuinely logged out at loop entry. The official
`claude auth login --claudeai` flow opened the system browser and completed
successfully. Authentication was not fabricated.

## Product Loss

Before Claude was reauthenticated, a real turn exposed a shared P1 lifecycle
loss. Claude SDK emitted an assistant envelope with:

- `is_api_error_message:true`;
- `error:authentication_failed`;
- text:
  `Failed to authenticate: OAuth session expired and could not be refreshed`.

The SDK then emitted `result.subtype=success`. Synara treated that synthetic API
error as a normal assistant message, marked the turn completed, and returned
the session to `ready` with `lastError:null`.

This was renderer-agnostic server behavior. Every client would show a fake
assistant reply and falsely healthy session.

## Fix

- Detect explicit Claude SDK `is_api_error_message` envelopes.
- Preserve their actionable text as the turn error.
- Do not emit assistant `content.delta` or `item.completed` for API errors.
- Override a later synthetic `success` result to `failed`.
- Keep the Claude adapter session in `error` with `lastError`.
- Persist failed `turn.completed` events as provider runtime `error` instead of
  clearing the error and marking the binding stopped.
- Clear the error only when a later real turn starts or completes successfully.

The fix lives only in shared server/provider code.

## Real Lifecycle Result

Claude after official OAuth:

1. canonical `thread.create`;
2. real `thread.turn.start`;
3. exact assistant reply `CLAUDE_CONNECTION_OK`;
4. canonical `thread.session.stop` -> `stopped`;
5. second real turn after restart/resume;
6. exact assistant reply `CLAUDE_RESTART_OK`;
7. final session `ready`, `lastError:null`.

Both Claude `turn.completed` runtime events were `state:completed`.

Codex:

- process/session connection succeeded;
- provider health remained `ready/authenticated`;
- real turn ended with the authoritative account error:
  `You've hit your usage limit ... try again at Aug 20th, 2026 12:29 PM.`;
- rate-limit projection reported no credits and balance `0`;
- the thread projected `latestTurn.state:error`, a full runtime error,
  failed turn detail, and `session.status:error`.

The Codex result is an external subscription state, not a Synara, Lynx, or
Lynxtron loss. Synara preserves the complete actionable error and reset time.

All temporary provider validation threads were canonically stopped and deleted.
Final projection checks found no live `provider-real-*` validation thread.

## Three-Client Parity

Web authority provider menu:

- Codex: enabled;
- Claude: enabled;
- Cursor: disabled with `Sign in`;
- unavailable providers labeled separately.

Lynx-for-Web provider menu:

- Codex row:
  `248x32 @ (745,181)`, `aria-label=Browse Codex models`;
- Claude row:
  `248x32 @ (745,213)`, `aria-label=Browse Claude models`;
- neither carries `aria-disabled`;
- the sole `Sign in` badge belongs to Cursor;
- real pointer interaction opened the menu;
- page errors empty.

Native:

- exact product picker rendered Codex and Claude enabled;
- Cursor alone rendered `Sign in`;
- selecting Claude opened the complete Claude model catalog;
- `Claude Sonnet 4.6` row measured `244x30 @ (807,223)`;
- no client-side provider fork or Lynx-only capability logic exists.

## Relay Harness Loss

The Lynx-for-Web diagnostics previously exposed only:

`pendingRequests = relayPending.size`

After managed terminal activity was added, the healthy long-lived
`terminal.subscribeEvents` stream remained in that map forever. A
`pendingRequests === 0` evidence gate therefore timed out even after every
ordinary RPC had settled.

Diagnostics now retain the compatible total and additionally expose:

- `pendingUnaryRequests`;
- `pendingUnaryTags`;
- `activeStreamRequests`;
- `activeStreamTags`;
- `pendingRequestTags`.

Final provider-picker evidence showed:

- pending unary requests: `0`;
- active streams: `1`;
- active stream tag: `terminal.subscribeEvents`;
- socket state: open;
- one connection attempt;
- no transport or RPC error.

This was a harness instrumentation loss, not product connectivity loss.

## Native Identity

Final staged bundle SHA-256:

`e3d944de93e41c78c1dbc7be807789056e54fe8662238fab3097e5350b4b0e21`

Final exact-owned Native:

- PID: `61841`;
- executable: workspace `@lynx-js/lynxtron@0.0.12-dev`;
- route: `synara://threads` -> `/`;
- DevTool client: `localhost:8902`, session `1`;
- staged bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`;
- one established product socket to `127.0.0.1:58090`;
- warning/error console: empty;
- Native left running for user experience.

Two earlier cold-launch attempts were rejected as harness mismatches:

- one omitted the required route argument;
- short-lived `nohup` ownership allowed the host process to exit after startup.

The retained run uses one foreground unified exec owner with
`SYNARA_BACKGROUND_LAUNCH=1`, so it remains background-safe and auditable.

Several Native DevTool input calls intermittently timed out and temporarily
hid the client from discovery. The product process and WebSocket remained
healthy, and the client re-registered. Existing Lynxtron input-harness
instability was not relabeled as provider failure. No provider-blocking
Lynxtron issue was proven, so no upstream issue was filed.

## Verification

- ClaudeAdapter full file: `117/117`;
- ProviderService full file: `66/66`;
- Web provider picker logic: `3/3`;
- Lynx relay/provider logic: `4/4`;
- server production build: passed;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed with registered warnings;
- complete workspace production build: `6/6`;
- Web/Lynx page errors: empty;
- final Native warning/error console: empty;
- browser entry/failure/exit gates: `sessions:[]`, zero owned processes;
- no repository screenshot added; screenshot count remained `100`.

## Loss Accounting

- `claude-api-auth-error-false-assistant-ready`:
  P1 product reliability, `1.00 -> 0.00`.
- `lynx-web-relay-stream-counted-as-pending-unary`:
  harness loss, `1.00 -> 0.00`.
- `codex-account-usage-limit`:
  external provider state, `1.00 -> 1.00`; excluded from product loss.

No score weight, sample filtering, or scope reduction changed.

Generated fidelity accounting:

- loss:
  `11.667654316861451 -> 11.539802495015246`;
- delta:
  `-0.12785182184620503`;
- scope contribution:
  `-0.13761467889908174`;
- completeness contribution:
  `+0.009762857052875162`;
- visual contribution:
  `0`;
- reliability contribution:
  `0`.

The P1 discovery and its complete retry-path fix were recorded without a
committed unresolved interval, so the final active reliability component is
zero. The generated sequence records the net scope/completeness change above;
its exact activation commit follows the final evidence revision rather than
being treated as a stable product identifier.
