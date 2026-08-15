# Compact Kanban rename cancellation

- Scope: populated project board × compact `390x844` × DPR 1 × dark × Rename
  task × real keyboard edit × Cancel.
- Renderer/snapshot: fresh production Lynx-for-Web bundle
  `58a584c4e8e3394787aa4c0c32401cba3a081f50fef8890015a586db8d95a860`
  against `.synara-fidelity-editor-changes`.
- Trusted pointer input opened the first card's actions chooser and selected
  `Rename task`.
- The mutation panel is `358x150 @ (16,56)`.
- Lynx-for-Web reports the `x-textarea.KanbanMutationTextarea` host itself as
  `0x0`, but its shadow-root native `<textarea>` is the real visible/editable
  surface: `354x58 @ (29,97)`.
- Trusted pointer input focused that real inner textarea. Keyboard input
  appended ` probe`; both the inner control and the custom-element host
  projected `Editor changes review probe`.
- Trusted pointer input selected `Cancel`. The panel closed, both cards
  remained, no `orchestration.dispatchCommand` appeared, and the read-only
  `projection_threads` snapshot was identical before and after.
- Page errors are empty. Console output contains only the known upstream Web
  Core deprecated-initialization warning.
- `lynx-kanban-card-rename-edit-cancel`: new P2 interaction coverage,
  component contribution `0.25 -> 0.00`.
- The first probes treated the custom-element host rectangle as the editable
  rectangle and therefore clicked `(0,0)`. Those attempts were rejected as a
  harness selector mismatch. A tentative explicit-height/focus patch was
  reverted before retention after the shadow-root control proved the product
  was already visible and editable.
- No product loss is assigned to the host `0x0` rectangle; it is a
  Lynx-for-Web custom-element projection delta. Native textarea/IME behavior
  remains a separate certification boundary.
- Exact-owned Native preflight was retried because DevTool ports were free.
  The official `@lynx-js/lynxtron@0.0.9` host binary was restored through its
  package installer and launched with isolated user data, background
  presentation, the staged production bundle, and DevTool enabled. The owned
  app rendered but published no DevTool listener/client, reproducing the known
  published-host harness blocker. It was stopped before any Native product
  claim; all owned processes and ports were released.
- Every browser attempt used `bun run browser:run -- ...`; final browser
  session and owned-process counts are zero.

## Evidence

- `00-open.json`
- `01-edited.{png,json}`
- `02-cancelled.json`
- `threads-before.json`
- `threads-after.json`
- `errors.json`
- `console.json`
- `bundle.sha256`
