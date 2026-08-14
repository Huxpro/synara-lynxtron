# Automations list fidelity

## New scope

- Web authority and Lynx-for-Web now cover `/automations`.
- Retained comparable states:
  - empty;
  - populated list with two active daily automations.
  - paused list with one disabled automation.
  - read-only detail with no previous runs.
  - paused detail after a real rendered Pause action.
  - not-found detail for a stale or deleted deep link.
  - initial create dialog.
  - expanded create dialog with schedule and worktree choices.
- Still missing and not claimed by this slice:
  - the full Web-equivalent create/edit field set;
  - detail mutations other than pause/resume, including delete and run now;
  - detail with previous runs;
  - paused and needs-review list visual cells;
  - Native certification.

## Shared data and capture identity

- Isolated server: `ws://127.0.0.1:58960`
- Web origin: `http://localhost:8921`
- Server instance:
  `8632a46a-5bfb-4f4d-afe7-8ee7e91df72f`
- Initial orchestration snapshot sequence: `0`
- Web, Lynx-for-Web, and Native-provenance preflight all reported that same
  server instance and sequence.
- Pause/resume used a second isolated run at `ws://127.0.0.1:58980` and
  `http://localhost:9061`, with the same preflight rules.
- Populated state was created through canonical `project.create` and
  `automation.create` RPCs. Cleanup used `automation.delete`; SQLite was never
  written directly.
- Browser sessions used `1280×820`, DPR 1, dark theme, and produced exact
  `1280×820` PNGs.

## Behavior

- Initial Lynx `refetchInterval` did not update an already-open page after a
  canonical automation create. Reloading did show the new row, proving data and
  projection correctness but exposing a live-refresh reliability loss.
- The fix uses the established host-backed timer path. In the retained runtime,
  an already-open Lynx page changed from one to two rows after a canonical
  create without reload.
- The hardened scheduler was separately reverified from zero to one row without
  reload after React Doctor review.
- Pause/resume was exercised through the rendered Lynx detail button and
  canonical `automation.update`: Active → Paused → Active, with no reload and
  no product console error.
- Delete was exercised through the rendered Lynx detail button. The Web-only
  harness now exposes the same confirm contract as Native:
  - Cancel preserved the detail and definition.
  - Confirm dispatched canonical `automation.delete`, navigated to the list,
    and rendered `No automations yet`.
- The confirm dialog is harness/platform UI rather than a product screen, so
  this behavior proof does not add or score a screenshot story.
- Detail editing was exercised through the rendered Lynx Edit dialog:
  - Cancel preserved the original name and prompt.
  - Save dispatched canonical `automation.update`.
  - A full page reload restored the edited name and prompt from the server.
- Web edits the same fields inline in the detail sidebar, while Lynx uses a
  modal suited to native text input. This is an intentional interaction delta,
  not a comparable screenshot state.
- `Run now` remains unverified because it launches a real provider turn and may
  create a worktree; no synthetic run was inserted into SQLite.

## Native certification attempt

- Production Native bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`
- Bundle SHA-256:
  `069b678549a8b1c41fe5113c82934e26243623053d435ad6df774504e06841fb`
- Exact-owned wrapper PID: `89278`
- Exact-owned Lynxtron PID: `89291`
- The process loaded `apps/lynx/dist/desktop`, was launched with
  `SYNARA_WS_URL=ws://127.0.0.1:59000`, wrote an isolated `1280×820` window
  state, and logged successful background startup. Without a DevTool client,
  the rendered data source could not be independently certified.
- The only DevTool client remained user-owned PID `60554`,
  `localhost:8901`, app `@t3tools/lynxtron`, session URL under
  `/Users/bytedance/github/t3code/`.
- Lynxtron `0.0.9` exposes `setDevToolEnabled` and `connectDevtool`, but no
  documented per-process listener port. The exact-owned parallel process did
  not register while the user client occupied the fixed endpoint.
- The user-owned process was not stopped. Native Automations evidence is
  therefore explicitly missing coverage, not a product failure or a passing
  certification.

## Geometry and visual classification

After calibration, Web and Lynx-for-Web matched exactly for:

- header: `x=256`, `y=0`, `1024×46`;
- page title: `x=408`, `y=78`, `720×32`;
- section title: `x=408`, `y=134`, `720×24`;
- list rows: `x=408`, `720×44`, starting at `y=160`.

Final full-frame parity:

- empty: `98.7281760620915%`;
- populated list: `98.63298312211063%`.
- read-only detail: `98.41580160011159%`.
- paused detail: `98.98107763430575%`.
- paused list: `99.169299976088%`.
- not-found detail: `99.43838586501674%`.
- create dialog: `97.82059832317073%`.
- expanded create dialog: `97.67314744241193%`.

The detail cell also matched the two `46px` headers, `704px + 320px`
columns, prompt title geometry, and the Status group exactly. Details and
Previous runs differed by at most `1px` vertically after the Web schedule
anatomy and timestamp copy moved into the shared projection.

The remaining pixel distance is accepted close rendering noise, not a P0/P1
product loss. The missing detail/create/Native cells remain explicit coverage
debt.

The create dialog remains a functional product residual despite its
machine-classified `close` pixel band (`97.82%` parity): Lynx now completes
Name, Prompt, Project, Cancel, and Create through canonical
`automation.create`, but Web still exposes the full schedule, model, runtime,
worktree, and policy form.

Adding Manual/Daily/Weekdays and Auto/Worktree choices improved functional
coverage but reduced full-frame parity from `97.82%` to `97.67%` because the
Lynx dialog became taller without yet adopting Web's complete field layout.
This is retained as a real residual rather than hidden by keeping only the
better-looking earlier frame.

## Evidence

Remote asset commits: `5341ec9`, `632a003`, `494974b`, and `fcfd182`.
Not-found evidence is stored in `e6d4e29`.
Create-dialog evidence is stored in `7a5ccbb`.
Expanded create-dialog evidence is stored in `9b46ffd`.

- `shots/2026-08-14/automations/empty/web-dark-1280.png`
- `shots/2026-08-14/automations/empty/lynx-dark-1280.png`
- `shots/2026-08-14/automations/list/web-dark-1280.png`
- `shots/2026-08-14/automations/list/lynx-dark-1280.png`
- `shots/2026-08-14/automations/list-paused/web-dark-1280.png`
- `shots/2026-08-14/automations/list-paused/lynx-dark-1280.png`
- `shots/2026-08-14/automations/detail/web-dark-1280.png`
- `shots/2026-08-14/automations/detail/lynx-dark-1280.png`
- `shots/2026-08-14/automations/detail-paused/web-dark-1280.png`
- `shots/2026-08-14/automations/detail-paused/lynx-dark-1280.png`
- `shots/2026-08-14/automations/detail-not-found/web-dark-1280.png`
- `shots/2026-08-14/automations/detail-not-found/lynx-dark-1280.png`
- `shots/2026-08-14/automations/create-dialog/web-dark-1280.png`
- `shots/2026-08-14/automations/create-dialog/lynx-dark-1280.png`
- `shots/2026-08-14/automations/create-dialog-expanded/web-dark-1280.png`
- `shots/2026-08-14/automations/create-dialog-expanded/lynx-dark-1280.png`

## Gates

- Shared projection tests: 2/2.
- Lynx focused tests: 8/8 in the final grouped run.
- Full workspace production build: 6/6.
- Delete focused tests: 19/19 for the combined detail and Web-host dialog
  contracts.
- Web and Lynx slice production builds passed after React Doctor fixes.
- React Doctor new warnings were reduced from six to one; the remaining
  `prefer-useReducer` warning is the pre-existing state shape of the Web
  Automations route.
- Web console had no page errors.
- Lynx-for-Web console had only the known upstream deprecated initialization
  warning.

## Workspace-mode continuation

### Product loss

- `lynx-automation-local-workspace-mode-missing`: P1 execution semantics,
  contribution `1.00 -> 0.00`.
- The retained create-dialog matrix already showed that Web exposed the full
  workspace mode contract while Lynx exposed only `Auto` and `Worktree`.
- The canonical contract supports `auto`, `local`, and `worktree`.
- Missing `local` meant a Lynx user could not explicitly require an automation
  to run in the existing checkout. That changes where writes land and is not a
  cosmetic form difference.

### Fix

- Derive the Lynx create-dialog mode type directly from canonical
  `AutomationWorktreeMode` instead of maintaining a narrower local union.
- Add the rendered `Local` choice.
- Preserve `local` unchanged in `AutomationCreateInput.worktreeMode`.
- Show `Local checkout` in the dialog summary.
- Existing safety remains unchanged:
  - runtime defaults to `approval-required`;
  - completion policy remains `none`;
  - no automation run was started.

### Verification

- `bun run test -- src/app/automationCreate.logic.test.ts src/app/AutomationsPage.lynx.test.ts`
  - 2 files, 11 tests passed.
  - Covers all three workspace modes plus existing schedule, dialog, create,
    detail, and edit contracts.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx production bundle and Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings
    only.
- No new screenshot is claimed for this source-backed follow-up. The valid
  create-dialog matrix remains the discovery evidence; the focused tests cover
  the newly closed payload branch.
- Native remains unverified; no provider turn or worktree was created.

### Local-mode safety correction

- Follow-up audit against `AutomationService` found that the initial Local UI
  change was incomplete: the server rejects `worktreeMode: local` unless
  `acknowledgedRisks` contains `local-checkout`.
- This was a real P1 payload loss, not a test-only concern. The visible option
  could otherwise submit a definition that the server would refuse.
- The payload builder now emits:
  - `['local-checkout']` for Local;
  - `[]` for Auto and Worktree.
- Focused tests assert the exact risk list for all three workspace modes.
- The same 11 focused tests and the full Lynx/Desktop production build passed
  after the correction.

### Remaining create-form coverage

- Model selection and full retry/misfire policy editing remain missing
  from the Lynx create form.
- These remain functional coverage debt. They are not hidden by the local-mode
  fix or by the existing visual score.

## Runtime permission continuation

### Product loss

- `lynx-automation-runtime-mode-missing`: P1 execution behavior,
  contribution `1.00 -> 0.00`.
- Web exposes `Approval required` and `Full access`; Lynx hard-coded every
  automation to `approval-required`.
- For unattended workflows this could park runs waiting for approvals even
  when the user intended and accepted full-access execution.

### Safe implementation

- Add explicit Permissions choices to the Lynx create dialog.
- Keep `approval-required` as the default.
- Selecting Full access opens a blocking confirmation with the same risk
  statement used by Web:
  `Scheduled full-access runs can make changes without per-step approval.`
- Cancelling the confirmation leaves Approval required selected.
- The canonical payload builder now accepts `RuntimeMode` and computes the
  exact server-required risk set:
  - approval + auto/worktree: `[]`;
  - approval + local: `['local-checkout']`;
  - full access + auto/worktree: `['full-access']`;
  - full access + local:
    `['full-access', 'local-checkout']`.
- This preserves the server's create/run invariant instead of merely exposing
  a visual toggle.

### Verification

- `bun run test -- src/app/automationCreate.logic.test.ts src/app/AutomationsPage.lynx.test.ts`
  - 2 files, 15 tests passed.
  - Includes all four runtime/workspace acknowledgement combinations and the
    blocking confirmation source contract.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx production bundle and Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings
    only.
- No automation was created or run during this safety-sensitive follow-up.

## Heartbeat targeting continuation

### Product loss

- `lynx-automation-heartbeat-mode-missing`: P1 execution semantics,
  contribution `1.00 -> 0.00`.
- Lynx could create only standalone automations, while Web supports heartbeat
  automations that continue one existing thread.
- This changes the execution model, thread identity, concurrency behavior, and
  eventual stop-policy semantics; it is not a cosmetic field omission.

### Fix

- Add Standalone and Heartbeat mode choices.
- Pass real sidebar thread summaries into the create dialog.
- Filter target choices to active threads in the selected project.
- Clear the selected target when project changes make it invalid.
- Disable Create while Heartbeat has no target.
- Preserve the target only for heartbeat payloads; standalone always sends
  `targetThreadId: null`.
- Show an explicit `No threads in this project` state rather than allowing an
  invalid heartbeat definition.

### Verification

- `bun run test -- src/app/automationCreate.logic.test.ts src/app/AutomationsPage.lynx.test.ts`
  - 2 files, 16 tests passed.
  - Covers heartbeat target preservation, standalone target clearing, project
    filtering source contracts, and all prior schedule/workspace/permission
    cases.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx production bundle and Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings
    only.
- No automation was created or run.

## Heartbeat completion continuation

### Product loss

- `lynx-automation-heartbeat-stop-policy-missing`: P1 termination semantics,
  contribution `1.00 -> 0.00`.
- Web lets a heartbeat define a natural-language `Stop when` condition; Lynx
  always persisted `completionPolicy: none`.
- Without this field, a heartbeat cannot stop on task completion and must rely
  only on max iterations or errors.

### Fix

- Reuse Web's pure `completionPolicyFromStopWhen` helper and canonical
  confidence threshold.
- Show a `Stop when` native input only for Heartbeat mode.
- Map non-empty input to `ai-evaluated`; trim it before persistence.
- Force standalone automations back to `completionPolicy: none`, even if a
  stale stop condition remains in local dialog state.

### Verification

- `bun run test -- src/app/automationCreate.logic.test.ts src/app/AutomationsPage.lynx.test.ts`
  - 2 files, 16 tests passed.
  - Heartbeat preserves the AI-evaluated policy; standalone clears it.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx production bundle and Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings
    only.
- No heartbeat or completion-evaluation run was started.
