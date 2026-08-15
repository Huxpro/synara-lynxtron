# Compact Kanban rename round trip

- Scope: populated project board × compact `390x844` × DPR 1 × dark × Rename
  task Save × projection refresh × Rename back.
- Renderer/snapshot: fresh production Lynx-for-Web bundle against
  `.synara-fidelity-editor-changes`.
- The first card started as `Editor changes review`.
- Trusted pointer input opened Rename. The shadow-root textarea was focused,
  its existing value was selected, and keyboard insertion replaced it with
  `Editor changes review roundtrip`.
- Trusted pointer input selected `Save`:
  - one `orchestration.dispatchCommand` was issued;
  - the card updated to the temporary title after the sidebar snapshot refresh;
  - the visible notice read `Task renamed`;
  - pending requests returned to zero with no RPC/transport error.
- The same product path then renamed the card back to
  `Editor changes review`:
  - a second canonical dispatch was issued;
  - the original card title and notice were rendered;
  - `projection_threads` matched the pre-run semantic snapshot exactly.
- Page errors are empty. Console output contains only the known upstream Web
  Core deprecated-initialization warning.
- `lynx-kanban-card-rename-save-roundtrip`: new P2 mutation coverage,
  component contribution `0.25 -> 0.00`.
- The first otherwise-successful attempt used `"$original•••"` inside a shell
  assertion, which zsh parsed as a different variable name. Its product state
  was restored through the second Rename before exit, but the sample lacked
  final console/error artifacts and was rejected. The retained run uses a
  plain prefix assertion and includes all gates.
- Native text selection/IME and system accessibility remain separate missing
  certification coverage.
- Every browser command ran through `bun run browser:run -- ...`; final
  sessions, owned browser processes, and owned ports are zero.

## Evidence

- `00-renamed.json`
- `01-restored.json`
- `threads-before.json`
- `threads-after.json`
- `errors.json`
- `console.json`
- `bundle.sha256`
