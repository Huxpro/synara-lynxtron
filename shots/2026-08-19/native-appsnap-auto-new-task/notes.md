# Native AppSnap Auto-New-Task Fidelity

## Scope

- Native AppSnap while Settings is active and no thread is open;
- canonical fresh Home task creation;
- capture attachment and route activation;
- consecutive AppSnap affinity within the shared 60-second window;
- pending-capture restart recovery;
- explicit removal cleanup and no premature acknowledgement.

## Product Loss

The original AppSnap owner creates a fresh task when neither a recent explicit
thread interaction nor a recent AppSnap target is available. The Lynx
coordinator instead left the capture pending until the user opened any thread,
which changed both destination and timing.

## Fix

- Reused the shared `resolveAppSnapTarget` 60-second target policy.
- Created fresh tasks through canonical `orchestration.dispatchCommand`
  `thread.create`, using the Home landing bootstrap's project, model, and
  environment defaults.
- Recovered lost create acknowledgements by checking the canonical sidebar
  snapshot before failing the capture.
- Routed the fresh task before attaching the picked image.
- Kept the manager capture pending until send or explicit removal.
- Restored pending captures to their persisted draft thread after restart.
- Removed the older effect that attached every pending capture to whichever
  thread happened to open later.

## Native Certification

The exact-owned final app loaded
`apps/lynx/dist/desktop/main.lynx.bundle`:

- final Native PID: `51736`;
- PID-derived DevTool client: `localhost:8902`, session `1`;
- final bundle SHA-256:
  `279862db0547fb6ebcebd0911a394f8c5dd521d0c00447aa577f5f85a57c1632`;
- final desktop main SHA-256:
  `3bda3e635d0be05293ba2fe79d9f4182fb4c51ce3b83c9771c2e7d6c3182115e`.

The real product flow used the staged AppSnap helper and its actual passive
both-Option listener:

1. Settings was active with no thread route.
2. Finder became the frontmost application and the real AppSnap helper
   captured a `337043` byte PNG.
3. The host emitted one canonical `thread.create` for
   `lynx-appsnap-thread-1787093111054-7b4fc89d3dddf8`.
4. The renderer navigated to that thread and requested the picked-image
   preview.
5. DevTool showed one real composer image chip.
6. The pending PNG and metadata remained on disk; no
   `appSnapAcknowledgeCapture` occurred.
7. A later successful capture outside the 60-second window correctly created a
   second fresh task.
8. Another successful Finder capture inside 60 seconds kept
   `thread.create` at `2 → 2`, reused the second task, and added a second picked
   preview.
9. After Native restart, the remaining pending capture reopened its original
   first task and received a new picked token, proving recovery did not attach
   it to the current or most recent route.
10. Activating the visible Remove controls emitted
    `attachmentsReleasePickedFile` followed by
    `appSnapAcknowledgeCapture`.
11. Both temporary tasks were deleted through the same two-stage Effect-RPC
    negotiation and `orchestration.dispatchCommand` path used by the Native
    host, accepted at sequences `658` and `659`.

The final exact-client error/warning console was empty. The AppSnap pending and
picked directories were empty, the server remained on PID `86856`, and the
final Native app remained running on the AppSnap Settings route.

## Harness Classification

- Two synthetic captures while Synara was frontmost were correctly rejected as
  `excluded_frontmost_application`; they are not product failures.
- One initial Native launch was tied to a unified-exec process group and was
  killed when that group ended. The retained certification used a detached,
  exact-owned process.
- DevTool discovery initially selected an unrelated another-project client. All retained
  checks explicitly targeted the client derived from the exact-owned PID.
- Midscene could take screenshots but lacked model configuration for actions;
  no Midscene action was retained as product evidence.
- No certification screenshot was added. The local screenshot count remained
  exactly `100`.

## Verification

- Lynx AppSnap attachment and routing tests: `8/8`;
- shared Web AppSnap target resolver: `16/16`;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- browser ownership entry/exit and every failure retry:
  `sessions: []`, zero agent-browser-owned processes.

## Residual

Custom modifier-plus-key global AppSnap chords still require a Lynxtron
`globalShortcut` capability. That existing P2 remains open and is not changed
by this slice.
