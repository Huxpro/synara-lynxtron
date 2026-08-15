# Editor empty-project first send

- Continuation of the empty-project Editor switch flow: project-scoped draft ×
  real first send × durable thread promotion × Editor continuation.
- Renderer/viewport/theme: fresh production Lynx-for-Web,
  `1280x820`, DPR 1, dark.
- The isolated server PATH used the verified Codex app-server binary.

## Canonical lifecycle

- A temporary zero-thread project, `editor-first-send-project-2`, was created
  through `project.create`.
- The Editor project switcher opened its `New chat` draft without changing the
  current main Editor thread.
- The composer received the exact prompt
  `Reply READY_EDITOR_PROMOTION only.` through browser `inserttext`.
- Trusted pointer input activated the rendered Send control.
- The product emitted canonical `thread.create` and turn-start commands.
- `onThreadCreated` navigated the Editor continuation to the new durable
  thread:
  - project identity became `Editor First Send`;
  - the draft rail disappeared;
  - one Editor surface remained;
  - the transcript rendered `READY_EDITOR_PROMOTION`;
  - relay pending requests returned to zero with no RPC/transport error.
- After evidence capture, the created thread and project were deleted through
  canonical orchestration commands (`sequence 37` and `38`).
- Both project attempts are tombstoned, no active temporary record remains,
  the temporary workspace contains no files, and all pre-existing thread rows
  are unchanged.

## Classification

- `lynx-editor-empty-project-first-send-promotion`: new P2 mutation/provider
  coverage, component contribution `0.25 -> 0.00`.
- This closes the completion-audit residual for empty-project first send and
  Editor continuation in the fast Lynx-for-Web loop.
- The first attempt used real keystroke typing for a longer prompt; the Web
  custom textarea collapsed it to `Reply exacfiles.`. The send assertion
  rejected the sample before dispatch and the project was canonically deleted.
  The retained run uses `keyboard inserttext`, verifies exact host/inner
  values before Send, and then uses the rendered Send control.
- Page errors are empty. Console output contains only known startup/runtime
  informational entries; no product RPC/transport error remains.
- This does not certify Native IME, provider execution, or route continuation;
  the official published Lynxtron host still fails the DevTool client gate.
- Every browser command ran through `bun run browser:run -- ...`; final
  sessions, owned browser processes, and owned ports are zero.

## Evidence

- `00-ready.json`
- `01-promoted.{png,json}`
- `created-thread-id.txt`
- `project-create-result.json`
- `thread-delete-result.json`
- `project-delete-result.json`
- `threads-before.json`
- `threads-after.json`
- `errors.json`
- `console.json`
- `bundle.sha256`
