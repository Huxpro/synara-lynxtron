# Thread Basic Flow Parity

## Reported Native losses

- A thread started with the `github` project selected is rendered under
  `Chats` instead of under that project.
- The rendered `example.js` file reference has link styling but no observable
  action.
- The thread composer composition differs from the Web authority.
- Plain Enter does not reliably send from the Native textarea.
- The two icon actions in the thread header do not match the Web authority in
  behavior.
- `CmdOrCtrl+R` closes the visible workspace app without a surviving relaunch.
- Resuming a Codex-backed thread can fail with `thread-store conflict` /
  `already has an active writer` and leave a full stack trace over the chat.
- Opening Environment while Changes or Files is already docked overlaps the
  two right-side surfaces instead of floating Environment beside the dock.

## Closed during audit

- Project-specific creation now retains the full landing bootstrap query key.
  Native verification sent
  `Native github association Enter verification 1787293900` from the rendered
  `/new-thread/lynx-landing-project-1787252573687-a9237c7f3bae08` surface. The
  resulting thread
  `lynx-landing-thread-1787298664226-1b47e02983941` persisted with project
  `github` and workspace `/Users/bytedance/github`.
- Native Return-to-send no longer depends only on unsupported textarea keydown
  delivery. The composer uses `catchkeydown` where key events are available and
  the native textarea's `bindconfirm` / `confirm-type="send"` path for desktop
  Return. The successful project-specific send above used a real macOS Return
  key.
- Absolute local transcript references now request a short-lived preview grant
  before reading. Clicking the rendered scratch `example.js` reference opened
  the Explorer preview with its JavaScript source and no console errors.
- The composer matches the Web footprint at `736×95` with a `16px` bottom
  inset, and shrinks to `401×95` beside the Changes dock.
- The thread header now exposes only the Web-authoritative Environment and
  Changes controls, in that order, at `28×28` each. The Settings route replaces
  the project sidebar with the Settings sidebar instead of stacking them.
- Environment and Changes are mutually exclusive in the header path. Native
  geometry recorded Environment at `x=817…1129` and Changes at
  `x=703…1129`; only one was visible in each retained state, so visible overlap
  is zero.
- `CmdOrCtrl+R` now starts an explicit detached replacement process before the
  old app exits. Final verification replaced PID `44200` with `75741`,
  preserved the `/new-thread/...github` route, loaded the staged production
  bundle, and produced an empty warning/error console.
- Codex resume now serializes concurrent starts per thread and treats
  `already has an active writer` / `thread-store conflict` as recoverable
  resume failures. The quarantined delivery at sequence `179` was reconciled as
  `safe_retry`; the session returned to `ready`, and the provider replied
  `writer recovery ok`.

## Verification contract

Each product loss remains open until the same snapshot, thread, route, theme,
and viewport are compared against the current Web implementation. Interaction
losses require use of the rendered control, not direct store mutation. Native
evidence must use the exact staged production bundle and include a clean
warning/error console.

The temporary Native frames used during verification were removed after the
measurements and persistence checks were recorded so the repository remains at
its 100-screenshot cap.
