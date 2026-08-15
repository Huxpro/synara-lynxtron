# Editor project switch to an empty project

- Newly exercised state: Editor open on an existing thread × project switcher
  × target ordinary project with zero active/archived threads × real project
  scoped New chat draft.
- Renderer/viewport/theme: fresh production Lynx-for-Web,
  `1280x820`, DPR 1, dark.
- Snapshot: `.synara-fidelity-editor-changes`.

## Canonical setup and cleanup

- A temporary project was created through
  `orchestration.dispatchCommand(project.create)`:
  - id: `editor-empty-project-2`;
  - title: `Editor Empty Project`;
  - workspace: `/tmp/synara-editor-empty-project-2`.
- No thread or composer fixture was written.
- The first diagnostic run used a server PATH without a usable Codex binary;
  the project draft rendered, but provider-model bootstrap left an RPC error and
  pending requests. It was rejected as a harness environment mismatch and the
  project was canonically deleted.
- The retained run prepended the verified Codex app-server binary directory to
  the isolated server PATH. All RPCs settled with no error.
- After capture, `project.delete` was dispatched through the same Effect-RPC
  path. Both temporary projects are tombstoned, zero matching active projects
  remain, and the thread projection is identical before and after.

## Product loss and correction

- Before this slice, project-switch options with `threadId:null` were rendered
  disabled with `No chats yet`. Editor could switch only to projects that
  already had a thread, making an empty project a dead destination.
- `resolveEditorProjectSwitchTarget` now returns one of:
  - current project;
  - latest existing thread;
  - project-scoped draft.
- The Editor rail tracks the selected draft project id rather than a bare
  boolean. The existing Landing composer and `onThreadCreated` route are reused;
  no parallel thread-creation path was added.
- Retained interaction:
  - opened the fixed project-switch overlay through the rendered trigger;
  - `Editor Empty Project` was enabled and labeled `New chat`;
  - trusted pointer input selected it;
  - the overlay closed while the main Editor remained on
    `Editor changes review`;
  - the chat rail changed to `New chat`;
  - the landing asked `What should we do in Editor Empty Project?`;
  - the composer was scoped to `synara-editor-empty-project-2`;
  - no thread was created because nothing was sent.
- Relay settled at zero pending requests with no RPC/transport error. Page
  errors are empty; console output contains only the known upstream Web Core
  deprecated-initialization warning.
- `lynx-editor-project-switch-empty-project`: P2 functional contribution
  `1.00 -> 0.00`.
- `lynx-editor-project-switch-empty-draft`: new P2 interaction coverage,
  contribution `0.25 -> 0.00`.
- No score weight, valid sample, or route scope was removed.

## Verification

- Focused Editor/project-switch tests: `10/10`.
- Root production build: `6/6`.
- Explicit Lynx-for-Web production build: passed.
- React diagnostics: zero errors/warnings.
- Screenshot: exact `1280x820`.
- Every browser command used `bun run browser:run -- ...`; final sessions,
  owned browser processes, and owned ports are zero.
- Native Editor/project-draft behavior remains missing certification coverage
  because the official published Lynxtron host still does not register a
  DevTool client.

## Evidence

- `00-before.json`
- `01-open.json`
- `02-draft.{png,json}`
- `create-result.json`
- `delete-result.json`
- `shell-created.json`
- `projects-before.json`
- `projects-after.json`
- `threads-before.json`
- `threads-after.json`
- `errors.json`
- `console.json`
- `bundle.sha256`
