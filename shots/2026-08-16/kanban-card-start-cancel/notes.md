# Compact Kanban start cancellation

- Scope: populated project board × compact `390x844` × DPR 1 × dark × Start
  task prompt collection × Cancel.
- Renderer/snapshot: fresh production Lynx-for-Web bundle against
  `.synara-fidelity-editor-changes`.
- Trusted pointer input opened the first Draft card's action chooser and
  selected `Start task`.
- The shadow-root textarea was `354x58 @ (29,97)` and initially empty.
- With an empty prompt, the rendered `Start` button carried `ui-disabled` and
  the disabled accessibility state.
- Trusted pointer input focused the real inner textarea. Keyboard input entered
  `Review the pending changes`; the custom-element host and inner textarea
  projected the same value, and the `Start` button became enabled.
- Trusted pointer input selected `Cancel` instead of starting work. Afterward:
  - the mutation panel closed;
  - both cards remained;
  - no `orchestration.dispatchCommand` or provider RPC was issued;
  - the read-only `projection_threads` snapshots were identical.
- Page errors are empty. Console output contains only the known upstream Web
  Core deprecated-initialization warning.
- `lynx-kanban-card-start-prompt-cancel`: new P2 interaction coverage,
  component contribution `0.25 -> 0.00`.
- This certifies prompt collection and cancellation only. It does not claim a
  provider start/send pass or Native IME certification.
- Every browser command ran through `bun run browser:run -- ...`; final
  sessions, owned browser processes, and owned ports are zero.

## Evidence

- `00-open.json`
- `01-edited.json`
- `02-cancelled.json`
- `threads-before.json`
- `threads-after.json`
- `errors.json`
- `console.json`
- `bundle.sha256`
