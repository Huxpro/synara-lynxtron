# N3 — Six real workflows, paired

Status: 6/6 workflows pass in both renderers. J3–J6 have evidence on the final
bundle. J1 and J2 have evidence on earlier bundles from the same day; the
provider stalled before they could be re-run on the final bundle (see
"Blocked and unverified").
Plan: [core-goal-review-and-next-phase-2026-09-29.md](core-goal-review-and-next-phase-2026-09-29.md) § N3.
Evidence: [n3-evidence/](n3-evidence/) (JSON: per-step timings and backend facts, no screenshots).

## How the workflows run

`node scripts/comparison-workflow-run.mjs <J1…J6> --renderer electron|native|both`
drives one workflow definition (`scripts/comparison-workflows.mjs`) through both
renderers of a certified N1 run and checks every step against the canonical
backend (orchestration snapshot, `automation.list`, `server.getSettings`).

- **Electron** is driven over CDP with mouse, wheel, text and key input.
- **Native** is driven through the Lynx DevTool with touch emulation, finger-drag
  scrolling and text insertion.
- **Targets** are accessible labels wherever both renderers expose the same one.
  The exceptions are recorded in the driver (`scripts/comparison-workflow.mjs`).
- **Provider turns are real Codex turns** (`gpt-5.6-luna`, low effort).
- **Workflows clean up** the threads and automations they create, so the next
  workflow sees the canonical fixture.

| Workflow                                                                                     | Steps (both renderers) | Evidence run                     | Bundle built  |
| -------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------- | ------------- |
| J1 new thread → turn → model picker → @ mention → stop/resend → reload                       | 6/6, 6/6               | `2026-09-29T14-57-08-460Z-10580` | 14:58         |
| J2 long transcript → follow → detach → Jump → tool activity → switch back                    | 6/6, 6/6               | `2026-09-29T15-28-57-360Z-39778` | 15:29         |
| J3 Explorer → listing → search → preview → Diff → close/reopen/reload → read failure + Retry | 6/6, 6/6               | `2026-09-29T17-52-20-213Z-68068` | 17:29 (final) |
| J4 thread ↔ Settings ×3 → theme/density → persist → reload → server setting across clients   | 6/6, 6/6               | `2026-09-29T17-52-20-213Z-68068` | 17:29 (final) |
| J5 create automation → edit → pause/resume → list and back                                   | 4/4, 4/4               | `2026-09-29T17-52-20-213Z-68068` | 17:29 (final) |
| J6 populated Kanban vs store/peer → task with real turn → open/return → reload → PRs         | 5/5, 5/5               | `2026-09-29T17-28-53-907Z-95913` | 17:29 (final) |

Numbers worth keeping from the evidence:

- **J1 stop.** The stopped turn settles 165–323 ms after Stop, and every marker
  message is stored exactly once.
- **J2 scroll.** While detached, the anchor row drifts 0 px under both
  streaming text and 5 tool activities. Jump returns to the end.
- **J6 Done latency.** A finished task shows Done 206–239 ms after the turn
  completes, in both clients. Before the sidebar fix, Native lagged up to 5 s.
- **J4 settings.** A server setting changed in either client appears live in
  the other.

## Product bugs found and fixed

Each was reproduced by a workflow, fixed at the source, and re-verified by the
same workflow.

| Fix                             | Commit      | What was wrong                                                                                                                                                          |
| ------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native streams replies          | `01fe65a54` | Turn start omitted `assistantDeliveryMode`, so the server buffered and Native showed no live text.                                                                      |
| Composer `@` workspace files    | `081016a73` | Native `@` offered only threads and agents; Electron also lists files.                                                                                                  |
| Closed Environment overlay      | `6b7671464` | Lynx does not inherit `pointer-events`. The invisible overlay took clicks over the left of the dock and could open an invisible menu whose backdrop blocked everything. |
| Explorer Retry                  | `a75ec6e33` | The retry handler was never passed to the dock or editor Explorer, so Retry did nothing.                                                                                |
| Live server settings            | `b1942cb66` | Native Settings read server settings once. A change made in another client never appeared until Settings was re-entered.                                                |
| Controlled text fields          | `f959231e3` | Typing into a controlled one-line field (automation title) aborted Lynxtron with SIGABRT, on 0.0.28 and 0.0.22 alike. The field was toggled readonly mid-input.         |
| Create automation stays on list | `018fdf48a` | Native opened the detail after Create; Electron stays on the list.                                                                                                      |
| Automation not-found page (web) | `81f34d89f` | Six identifiers were never imported; opening a deleted automation replaced the app with the error screen.                                                               |
| Live sidebar and Kanban         | `556ab08be` | Statuses refreshed only on a 5 s poll.                                                                                                                                  |
| Send as draft state             | `eb6706f0c` | The switch reported no on/off value.                                                                                                                                    |

`081016a73` also aligns the model trigger's accessible name with Electron
("Change model and reasoning").

## Parity differences recorded, not fixed here

- **New-thread landing dock.** Native disables the dock on the new-thread
  landing (`LandingDiffToggle`); Electron opens it on the draft thread. J3
  therefore starts from an existing thread.
- **Explorer read error.** Electron shows the error detail (the permission
  message and path); Native passes `detail={null}`.
- **Automation detail.** Native has no "Run now" action. Running automations
  is outside N3 by plan.
- **Kanban New task copy.** The dialog descriptions differ ("Draft a prompt and
  place it in the board's Draft column…" vs "Add a draft or start work
  immediately.").
- **Transcript end inset.** At the end, the last row's bottom sits at 632 px in
  Electron and 612 px in Native. Carried to N4.
- **Electron (reference) behaviors recorded, not asserted.**
  - It re-encodes app settings through its schema on load and drops unknown
    keys; Native keeps them (J4 sentinel).
  - Its sidebar Automations entry does not leave an open automation detail.
  - "Send as draft" tasks live only in its local composer store, so they are
    not canonical and never reach Native. Boards are compared without drafts.
- **Streams after a LynxView reload.** The host keeps the old long-lived
  streams, and the reloaded page's new subscriptions are rejected as
  duplicates and retried every second. Events still arrive through the old
  streams. Only DevTool reloads trigger this: the product's Reload relaunches
  the process.

## Blocked and unverified

- **J1/J2 on the final bundle.** At 17:52 every provider turn ended with "The
  provider accepted this turn but produced no runtime events", in both
  renderers. _Corrected in N4:_ this was first recorded as an external
  provider stall, but the message comes from a 15-second first-event
  watchdog in uncommitted working-tree changes to `ProviderCommandReactor.ts`,
  which the harness runs. The cause of the silence (provider or that change)
  was not isolated. J1 and J2 passed on earlier bundles the same day; see
  [n4-matrix-2026-09-29.md](n4-matrix-2026-09-29.md) for the final-build runs.
- **Populated pull requests.** Named blocked cell: the fixture workspace has no
  GitHub remote. Both renderers show the same empty state.
- **Process restart.** "Restart" is verified as a renderer reload. A LynxView
  reload returns Native to its launch route, which is recorded. The product
  Reload (menu, Cmd+R) relaunches the process with the current route, but
  driving it needs OS-level input, and the request to control the app was
  declined.
- **Native context menus.** Kanban card actions open an OS menu in Electron,
  which CDP cannot reach, so write-back is verified through task creation
  instead.
- **Electron native `<select>`.** Its popup menus are outside the page. J5 sets
  that one select value through the element and labels the result
  accordingly; Native uses real menu taps.
