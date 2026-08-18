# Provider Stop/Delete Lifecycle

## Scope

- shared server/provider lifecycle, renderer agnostic;
- real authenticated Claude Max session through `claudeAgent`;
- canonical `thread.create -> thread.turn.start -> thread.session.stop + thread.delete`;
- isolated server `127.0.0.1:58090`, state directory `.synara-sxs/dev`;
- exact-owned Native PID `7296`, PID-derived DevTool client
  `localhost:8902`, session `1`.

No provider fixture or direct SQLite mutation was used. SQLite was read only
for projection and delivery verification. Historical delivery reconciliation
used `orchestration.reconcileProviderDelivery`.

## Loss

A provider stop could complete successfully while a concurrent thread delete
soft-deleted the projection. The stop reactor then dispatched
`thread.session.set`, which correctly rejected writes to the deleted thread but
incorrectly turned the already-completed provider cleanup into an `uncertain`
durable delivery.

The stale delivery blocked hard purge, produced repeated
`thread deletion retained unresolved provider delivery evidence` warnings, and
caused restart reconciliation to repeatedly try `thread.session.set` on a
deleted thread.

This was a shared P1 provider lifecycle loss affecting Codex and Claude. It was
not a Lynx, Lynxtron, Web, or rendering issue.

## Fix

- After `providerService.stopSession` succeeds, re-read the thread before
  projecting `stopped`.
- If deletion won the race, finish the durable delivery without writing a
  deleted projection.
- Keep provider stop failures fail-closed; only a successful side effect plus
  confirmed deletion takes the terminal-success path.
- Exclude soft-deleted threads from startup turn reconciliation in both the
  effectful selector and the pure planner.
- Preserve the normal deleted-thread command invariant for every other write.

## Focused Verification

- `ProviderCommandReactor.test.ts`: `102/102`.
- `startupTurnReconciliation.test.ts`: `13/13`.
- The race test blocks the provider stop, deletes the thread, releases the
  successful stop, and requires the delivery to become `succeeded` with no
  blocker.

## Real Provider Verification

Temporary thread:

`provider-stop-delete-race-1787068501848`

1. Claude completed the exact reply turn and returned to `ready`.
2. Canonical stop and delete were issued concurrently.
3. Stop intent sequence: `545`.
4. The thread projected `deletedAt=2026-08-18T15:55:08.428Z`.
5. `orchestration.listProviderDeliveryBlockers` returned `[]`.
6. No direct cleanup mutation was required.

The final server restart loaded sequence `526` and reached `Synara running`
without the previous deleted-thread restart reconciliation warning. Native
automatically re-established its product socket to `127.0.0.1:58090`.

## Historical Reconciliation

The current isolated state contained ten blockers, all for already-deleted
threads. They were closed through the canonical reconciliation API:

- six stop deliveries whose errors proved the provider side effect had
  completed before the deleted-thread projection race: `accepted`;
- four historical ambiguous or obsolete intents that could not be safely
  replayed: `abandon`.

Final durable state:

- provider blockers: `0`;
- succeeded deliveries: `54`;
- reconciliation audit rows: `6 accepted`, `4 abandon`;
- active starting/running/error sessions: `0`;
- active pending interactions: `0`.

## Runtime Audit

- server health: `ok`, all startup readiness flags true;
- Native DevTool error/warning console: empty;
- Codex CLI available; product resolver continues to select the authenticated
  ChatGPT bundled binary rather than the PATH shim;
- Claude CLI `2.1.226`, authenticated Claude Max path previously and currently
  proven by real turns;
- local repository screenshot count remained `100`;
- browser ownership gates returned `sessions: []` and zero
  agent-browser-owned processes.
