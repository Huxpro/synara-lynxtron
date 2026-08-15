# Compact Kanban card actions in light theme

- Scope: populated project board × compact `390x844` × DPR 1 × light × card
  actions open/cancel.
- Renderer/snapshot: fresh production Lynx-for-Web bundle against
  `.synara-fidelity-editor-changes`.
- Theme preflight set browser media before product navigation and asserted
  `SliceRoot--theme-light`.
- Trusted pointer input opened the first card's action chooser.
- The chooser is `358x154 @ (16,56)`, ends at `x=374`, and remains fully
  contained inside the compact viewport.
- Resolved light-theme paint:
  - panel: white `rgb(255,255,255)` with `rgba(13,13,13,0.07)` border;
  - ordinary/Cancel labels: `rgb(13,13,13)`;
  - Archive/Delete labels: destructive `rgb(224,46,42)`;
  - ordinary and destructive-outline buttons retain the same compact
    geometry as the dark cell.
- Trusted pointer input selected `Cancel`; the chooser closed, both cards
  remained, no dispatch occurred, and `projection_threads` was unchanged.
- Page errors are empty. Console output contains only the known upstream Web
  Core deprecated-initialization warning.
- `lynx-kanban-card-actions-compact-light`: new P2 theme/interaction coverage,
  component contribution `0.25 -> 0.00`.
- The first attempt changed media after navigating, leaving the already
  initialized root in dark theme. That sample failed the theme gate and was
  discarded before product classification.
- Native light-theme card actions remain missing certification coverage.
- Every browser command ran through `bun run browser:run -- ...`; final
  sessions, owned browser processes, and owned ports are zero.

## Evidence

- `00-open.json`
- `01-closed.json`
- `threads-before.json`
- `threads-after.json`
- `errors.json`
- `console.json`
- `bundle.sha256`
