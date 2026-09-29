# N1 — Verification chain

Status: exit criteria met on 2026-09-29.
Plan: [core-goal-review-and-next-phase-2026-09-29.md](core-goal-review-and-next-phase-2026-09-29.md) § N1.
Runtime: `@lynx-js/lynxtron` 0.0.28 (devtool variant, byte-identical to the
official v0.0.28 release).

## Root causes

| Finding (plan id)                   | Cause                                                                                                                                                                                                                                                                                                                                                                            | Fix                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mixed backend identity (R-01)       | `lynx.config.ts` compiled `SYNARA_WS_URL` into the Native renderer. RPC and Terminal went through the host process (runtime env), but renderer-derived origins (attachment URLs, site favicons) and the reported `baseUrl` used the compiled port. A bundle reused under a different server therefore talked to two backends.                                                    | Product: the Lynxtron host passes its live endpoint as `runtimeWsUrl` init data on every bundle load; `platform/runtimeEndpointSource.ts` reads it synchronously on both threads. The Native environment now compiles no endpoint (`""`), so one build serves every run.                                                                          |
| Empty / hidden workspace (R-01)     | The pre-fixture seed had one ordinary-project thread with two messages; retention hid inactive threads on startup.                                                                                                                                                                                                                                                               | `scripts/comparison-fixture.mjs` builds a real git workspace and creates project, threads, and Home/Studio containers only through canonical RPC, runs five real provider turns (tool use, file edit, table, code block, 40-row list), then freezes the database. Retention is disabled for isolated homes (`SYNARA_DISABLE_THREAD_RETENTION=1`). |
| Launcher failure attribution (R-04) | The launcher never kept an activity trail or child exit order. `dev exited 143` is 128+SIGTERM: the launcher's own cleanup. The historical `Promise was collected` is the CDP error for an `awaitPromise` evaluation whose context was destroyed by a navigation. Removing the per-run Native rebuild exposed a second race: the page target exists before its document commits. | Every Electron evaluation goes through one CDP client that records request id, activity, attempt, and timing; idempotent reads retry through context loss (bounded to three attempts). An explicit document-ready gate precedes any module import. Child exits are recorded with `duringShutdown`.                                                |
| Repeated rebuilds (R-04)            | The Native bundle had to be rebuilt after the backend started, only to compile its port in.                                                                                                                                                                                                                                                                                      | One endpoint-independent build per source state. A build stamp records a content digest of every non-test Native input (path + bytes) and the bundle hashes; `--skip-build` refuses any mismatch. Committing identical content does not invalidate it.                                                                                            |

`Promise was collected` recurred twice during N2, both times on the first
evaluation that lazily loaded a right-dock pane's code for the first time in a
fresh dev server: once in the harness (`opening the canonical Electron git
pane`, named by the trail) and once in a manual CDP probe opening the browser
pane. Both times the identical second attempt succeeded once the dev server had
served that code. That matches a
dev-server reload on first dependency discovery destroying the evaluation's
context. Vite printed nothing, so the mechanism is inferred; the failing
request is not. The harness now records `Runtime.executionContextDestroyed`/
`Page.frameNavigated` in the same trail and retries idempotent pane openers
through context loss.

## Certification contract (scripts/dev-electron-lynxtron.mjs)

Each run writes `.synara-desktop-comparison/runs/<runId>.json` and certifies,
in order:

1. Build identity: stamp matches the content of the current Native inputs and bundles.
2. Seed identity: the clone matches `fixture.json` (project, workspace, visible
   threads, message counts, transcript tails, event sequence).
3. Backend identity: `bootstrap.negotiate` server instance and snapshot
   sequence; the anchor thread is visible in the backend snapshot.
4. Electron: document ready, route stable, sidebar/transcript anchor, clean
   transient UI.
5. Native: DevTool DOM anchor, then every established Native TCP socket must
   reach the certified backend port (`lsof`), covering RPC, streams, and
   Terminal.
6. Data freeze: no orchestration event after the seed sequence and an unchanged
   server instance.

Shutdown (normal, failure, or `--exit-after-certify`) verifies zero owned
Lynxtron, Electron, and Vite processes and records the result.

## Exit evidence

| Run                              | Case                       | Result                                                                    |
| -------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| `2026-09-29T13-03-39-283Z-96686` | clean start 1              | certified; backend `:54747` `91f7bd1a`; sequence 112→112; cleanup clean   |
| `2026-09-29T13-04-20-602Z-6252`  | clean start 2              | certified; backend `:55143` `15ef3f6d`; sequence 112→112; cleanup clean   |
| `2026-09-29T13-04-58-980Z-14777` | clean start 3              | certified; backend `:55542` `2176b66e`; sequence 112→112; cleanup clean   |
| `2026-09-29T13-05-57-982Z-27446` | missing thread             | refused before launch; cleanup clean                                      |
| `2026-09-29T13-06-03-422Z-28612` | tampered Native bundle     | refused (`lynxBundle differs from the stamped build`); cleanup clean      |
| `2026-09-29T13-06-06-486Z-29250` | stale Native sources       | refused (`uncommitted Native sources changed`); cleanup clean             |
| `2026-09-29T13-06-09-942Z-29946` | fixture/clone mismatch     | refused (`ends at … expected assistant:not-the-real-tail`); cleanup clean |
| `2026-09-29T13-06-28-010Z-33851` | cold Vite dependency cache | certified without retries; cleanup clean                                  |

In every certified run both renderers anchored on thread
`comparison-fixture-transcript-v2` at the same last message, the Native process
held exactly one established socket and it reached the run's backend, and no
event was appended after the seed.

A wrong-backend Native socket is covered by the `lsof` classifier unit tests
(`scripts/comparison-run.test.mjs`); it was not staged live.

## Not covered by N1

- Visual parity of any surface. DS-182 to DS-184 remain "rendered style
  observed", not "paired product verified" (see the coverage note in
  [fidelity-continuation-backlog-2026-09-13.md](fidelity-continuation-backlog-2026-09-13.md)).
- Light theme and 1280×820 / 1440×900 viewports were not exercised; the
  certification path is theme- and size-independent, but cells are N4.
- The fixture is static. Mutating workflows (N3) must run on their own threads
  or a disposable copy, never on the frozen fixture.
