# Narrow Editor project switching

- New viewport combination: Editor project switch overlay × populated projects
  × `320x568` × DPR 1 × dark × bidirectional existing-thread switch.
- Renderer/snapshot: fresh production Lynx-for-Web against
  `.synara-fidelity-editor-changes`.
- The project-switch dialog measured `288x178 @ (16,195)` and remained fully
  inside the viewport.
- Close control: `28x28 @ (265,206)`.
- Both project rows were `254x34 @ x=33` and ended at `x=287`.
- Trusted pointer input switched:
  1. `Editor Changes` -> `Editor Secondary`;
  2. `Editor Secondary` -> `Editor Changes`.
- Exactly one `ThreadEditorView` remained after each navigation, proving the
  Editor continuation contract did not fall back to ordinary Chat.
- Final relay diagnostics show zero pending requests and no RPC/transport
  error. Page errors are empty; console output contains only known startup
  information.
- `lynx-editor-project-switch-320`: new P2 viewport/interaction coverage,
  component contribution `0.25 -> 0.00`.
- No product loss was found, no score weight or valid sample was changed, and
  no screenshot was retained for this geometry-only cell.
- Native narrow-window project switching remains missing certification
  coverage.
- Every browser command ran through `bun run browser:run -- ...`; final
  sessions, owned browser processes, and owned ports are zero.

## Evidence

- `00-open.json`
- `01-secondary.json`
- `02-restored.json`
- `threads.json`
- `errors.json`
- `console.json`
- `bundle.sha256`
