# Integrations Connected Stdio Roundtrip

## New Scope

- lifecycle:
  `create -> pair -> stdio tools/list -> synara_overview -> connected -> continue setup -> revoke`;
- clients:
  Web authority, Lynx-for-Web, exact-owned Native;
- state:
  paired credential, first real MCP request, last-used projection, connected
  setup prompt, enabled example prompt;
- theme:
  dark;
- viewport:
  browser `1280x820`, DPR `1`; Native `1280x820` outer,
  `2560x1640` physical;
- server:
  isolated `127.0.0.1:58090`.

This state had not previously been retained. Earlier Integrations evidence
covered only unpaired setup and UI capability parity.

## Protocol Identity

The real server-issued stdio launcher was used without modifying its command or
integration arguments.

Pairing:

- invoked the real `synara mcp pair --code ... --home-dir ...` CLI path;
- wrote a private client credential through the production credential store;
- changed the canonical integration projection from unpaired to paired.

Stdio client:

- launched the real `mcp serve --integration ...` bridge;
- sent newline-delimited MCP JSON-RPC;
- `tools/list` returned exactly:
  - `synara_overview`;
  - `synara_capabilities`;
  - `synara_list_allowed_projects`;
  - `synara_create_task`;
  - `synara_wait_for_task`;
  - `synara_read_task`;
- `tools/call synara_overview` returned:
  - 4 visible projects;
  - 9 provider statuses;
- stderr was empty.

The real call updated both:

- `pairedAt`;
- `lastUsedAt`.

No tool or overview payload was faked.

## Three-Client Result

Web authority:

- connected row rendered `Continue setup` and `Revoke`;
- Continue setup rendered:
  - `Connected`;
  - `Done`;
  - guided setup prompt;
  - manual setup disclosure;
  - enabled `Copy example prompt`;
  - `Connection verified by Synara.`;
- the paired setup prompt omitted the one-time `syn_pair_v1_` code while
  retaining Codex, Claude Code, and generic JSON registration paths.

Lynx-for-Web:

- `Connected` projection present;
- `Done` action:
  `41.609375x24 @ (1025.390625,161)`;
- `1. Give your agent this prompt` present;
- `2. Try it` present;
- `Copy example prompt` enabled:
  `598x24 @ (469,818)`;
- `Connection verified by Synara.` present;
- no pairing code remained in the connected setup prompt;
- Codex and Claude registration commands remained present;
- relay:
  one open socket, zero pending unary requests, one expected terminal stream,
  no transport/RPC error;
- page errors empty.

Native:

- exact-owned connected row rendered:
  - `Fidelity connected UI`;
  - `Connected`;
  - `Continue setup`;
- warning/error console empty;
- one established product socket to the same server;
- physical screenshot was `2560x1640`.

## Classification

No new product loss was found.

This closes missing coverage for the real paired/connected/first-use state.
Passing setup UI alone was not used as a proxy; the credential exchange, stdio
transport, tool listing, real overview call, last-used mutation, and all three
renderer projections were independently verified.

## Cleanup

Two temporary real-lifecycle integrations were used:

- one bounded protocol proof;
- one shared connected UI snapshot.

Both were canonically revoked. Their private credential files were explicitly
deleted after revocation.

Final checks:

- active integration list: empty;
- target audit row:
  `pairedAt != null`, `lastUsedAt != null`, `revokedAt != null`;
- credential file exists: false.

No active integration credential or pairing code remains.

## Harness Losses

- The first pair script used a wrong relative CLI path and failed before
  pairing. Its integration was revoked in `finally`; no credential was
  created. The retry used the absolute server-issued launcher.
- No harness failure was attributed to product behavior.

## Verification

- real pair/stdio/overview roundtrip: passed;
- external MCP bridge and gateway tests: `20/20`;
- Web/Lynx page errors: empty;
- Native warning/error console: empty;
- browser entry/failure/exit gates:
  `sessions: []`, zero owned processes;
- no repository screenshot added;
- screenshot count remained `100`.

Product result: pass. Coverage contribution: `1.00 -> 0.00`.

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
