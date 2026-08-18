# Claude Pending Approval Roundtrip

## New Scope

- screen: active Claude thread with a pending command approval;
- provider: authenticated Claude Max through `claudeAgent`;
- runtime mode: `approval-required`;
- state: real Bash tool request blocked before execution;
- theme: light;
- viewport: Web and Lynx-for-Web `900x650`, DPR `1`; Native `900x650`
  logical and `1800x1300` physical;
- interactions:
  - Native `Approve once`;
  - a second command proving approval was not persisted;
  - Native `Decline`;
  - Lynx-for-Web `Decline`.

No provider fixture, direct SQLite write, or synthetic pending-interaction event
was used.

## Canonical Pending State

The retained Native thread was
`fidelity-claude-approval-1787064877685`.

Claude requested Bash:

`printf CLAUDE_APPROVAL_OK > /tmp/synara-claude-approval-1787064877685.txt`

Before approval:

- session: `running`;
- latest turn: `running`;
- one pending approval settlement;
- request:
  `37990f7f-bda5-4569-952b-2d5bcfc54969`;
- lifecycle generation:
  `a6885073-044e-4438-8a6f-2db50e8006b7`;
- proof file existed: false;
- durable activity:
  `approval.requested / Command approval requested`.

## Identity Preflight

All comparable clients used the same server and canonical pending snapshot.

Web authority:

- route:
  `/fidelity-claude-approval-1787064877685`;
- light, `900x650`, DPR `1`;
- complete detached approval card;
- page errors empty.

Lynx-for-Web before:

- route:
  `/lynx/index.html?route=%2Fthread%2Ffidelity-claude-approval-1787064877685`;
- light, `900x650`, DPR `1`;
- same thread, command and pending activity;
- page errors empty.

Exact-owned Native:

- PID `7296`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- staged bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `31e3064d7348797a359afa6e6c8e1688258e20a893fd1febe099bc12faa0385d`;
- root:
  `SliceRoot--theme-light`, `900x650`;
- one established product socket to `127.0.0.1:58090`;
- exact-client warning/error console empty.

## P1 Capability Loss

Web authority rendered the full pending approval contract:

- `Approve this command?`;
- parsed `Bash` command detail;
- `Approve once`;
- `Always allow this session`;
- `Decline`;
- `Cancel turn`;
- descriptions and scoped shortcut order.

Lynx-for-Web and Native rendered only transcript history:

- `Command run`;
- `Command approval requested`;
- `Thinking`.

They exposed no action that could send `thread.approval.respond`. The real
Claude turn remained blocked indefinitely. This was a P1 functional capability
loss, not visual noise, missing provider data, or a platform simplification.

## Root Cause

The Lynx thread detail projection discarded `pendingInteractions`. The renderer
only consumed `hasPendingApprovals` in sidebar/toast summaries and had no
thread-local approval composition or response command.

Web also owned approval action order, labels, descriptions and detail parsing
inside one Web-only component, so adding a separate Lynx implementation would
have created product-logic drift.

## Fix

- Extract approval actions, request-kind prompts, command/file detail parsing,
  and path shortening into shared renderer-agnostic logic:
  `apps/web/src/components/chat/ComposerPendingApprovalPanel.logic.ts`.
- Keep the Web panel on that shared model.
- Project canonical approvals in Lynx with the existing shared
  `derivePendingApprovals(activities, pendingInteractions)`.
- Render a detached Lynx approval panel above the composer with the same four
  actions and order.
- Dispatch canonical `thread.approval.respond` with request ID, lifecycle
  generation, decision and timestamp.
- Refresh the active thread query after settlement.

Only physical rendering and event bindings are Lynx-specific.

## Post-Fix Native

The retained pending panel measured:

- panel:
  `616x247 @ (272,300)`;
- detail:
  `586x28 @ (287,339)`;
- four-action list:
  `586x136 @ (287,377)`;
- composer:
  `616x95 @ (272,555)`.

The panel and composer do not overlap. All four rendered buttons had explicit
accessibility labels.

### Approve once

The real Native `Approve once` button produced:

- `approval.resolved`, decision `accept`;
- first proof file created;
- Bash tool completed;
- assistant reply `Done.`;
- pending interactions empty;
- final session `ready`, `lastError:null`.

A second dangerous command on the same session produced another approval
request. This proves `Approve once` did not silently persist full access.

### Decline

The real Native `Decline` button on the second request produced:

- `approval.resolved`, decision `decline`;
- tool result `User declined tool execution.`;
- second proof file remained absent;
- pending interactions empty;
- turn completed;
- final session `ready`, `lastError:null`.

## Post-Fix Lynx-for-Web

A separate real Claude approval thread used:

`echo 'Release candidate ready' > /tmp/synara-release-note-1787066369268.md`

The fixed Lynx-for-Web renderer showed the same complete approval panel.
Because custom Lynx buttons are not exposed to agent-browser role lookup, the
first semantic locator attempt was rejected as harness loss. A measured
shadow-root button box then drove the real rendered pointer path.

The rendered `Decline` control produced:

- `approval.resolved`, decision `decline`;
- proof file remained absent;
- tool failed with the canonical declined result;
- pending interactions empty;
- turn completed;
- final session `ready`.

## Harness Losses

- A read-only `printf` command was auto-allowed by Claude's default policy and
  did not create an approval. It was not used as evidence.
- A later model run recognized an obvious approval-sentinel prompt and refused
  to call Bash. That terminal thread was canonically deleted.
- The original long-running server was started under a shell whose stdout and
  stderr pipes had no reader. Both 16 KiB pipes filled, and Bun spent one core
  retrying writes; `/health` and RPC opens timed out. The owned server group was
  stopped and restarted in a unified exec session that continuously consumes
  output. Two wrong-state restart attempts were rejected before product
  evidence because they loaded `.synara-sxs/userdata` and `~/.synara/userdata`
  instead of `.synara-sxs/dev`.
- A Native helper capture raced the second pending query refresh and found no
  panel. The frame was rejected; a fresh exact-owned launch captured the
  canonical pending state.
- agent-browser semantic role lookup did not see the Lynx custom button. The
  retained pointer interaction used the measured rendered button center.

None of these harness failures is counted as product loss.

## Cleanup

All temporary approval threads were canonically stopped and deleted. The first
and second Native proof files and the Lynx-for-Web proof file were explicitly
removed or verified absent.

The Native app and exact `.synara-sxs/dev:58090` server remain running.

## Verification

- shared approval model tests: `2/2`;
- Lynx approval wiring tests: `3/3`;
- Native/Desktop production build: passed;
- Lynx-for-Web production build: passed;
- Web and Lynx-for-Web page errors: empty;
- Native warning/error console: empty;
- browser workflows ran under `browser:run`;
- every failed/interrupted browser or DevTool step was followed by
  `browser:gate`;
- no repository screenshot added;
- repository screenshot count remained `100`.

Product contribution: `1.00 -> 0.00`.
