# Editor New chat fidelity loop

## Scope

- Screen: Editor view, Chat rail New item flow.
- State: project-scoped empty draft before first send.
- Theme / viewport: light, 1280 x 820, DPR 1.
- Shared isolated state: `.synara-fidelity-editor-changes`, server `127.0.0.1:59260`.
- Lynx-for-Web route: `?route=/thread/editor-changes-thread&editor=open&editorNewChat=open`.

## Authority contract

Web `New chat` does not immediately create a durable thread. It opens a project-scoped draft, preserves `view=editor`, and promotes the thread through the canonical create/send flow only when the first message is sent.

## Lynx implementation

- Reuses the existing `LandingComposer` instead of adding a second thread-creation path.
- The active Editor project id is passed as `initialProjectId`.
- Before first send, the rail shows `New chat`, the centered empty landing, and the real composer.
- `LandingComposer` retains its existing `ensureLandingThreadCreated` contract: coalesced canonical `thread.create`, persistence recovery, and retry after confirmed failure.
- On successful first send, `onThreadCreated` navigates to the new thread through an Editor continuation token. The new `ThreadPage` remount therefore stays in Editor mode.
- Opening the ordinary Chat tab clears the draft view without creating a thread.

## Evidence

- Exact relay active at `ws://127.0.0.1:59260`.
- `lastTransportError: null`, `lastRpcError: null`.
- Draft rail geometry: `384 x 728` at `(896, 92)`.
- Composer geometry: `328 x 133` at `(924, 461.5)`.
- Header identity: `New chat`.
- Project identity: `Editor Changes` / `synara-editor-changes`.
- No `orchestration.dispatchCommand` occurred before first send.
- Screenshot: `lynx-web-new-chat-1280x820-light.png` (`1280 x 820`).

## Classification

| Item                                            | Classification                    | Result                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing Editor New chat draft                   | product loss, P2                  | closed                                                                                                                                                      |
| Duplicate creation / first-send retry semantics | reliability contract              | reused existing tested `LandingComposer` path                                                                                                               |
| Preserve Editor after successful promotion      | product/navigation loss           | closed by explicit Editor continuation token                                                                                                                |
| Real first send with provider response          | missing provider/runtime coverage | not claimed; isolated environment has no usable Codex CLI                                                                                                   |
| Lynx-for-Web trigger click                      | historical dynamic-event blocker  | deterministic state remains the retained evidence for this cell; the global blocker was closed later, but New chat still needs a current-head trigger rerun |
| Native interaction                              | missing certification coverage    | not claimed; user-owned Native process remained untouched                                                                                                   |

## Validation

- Focused Rstest: Editor/Landing creation/deep-link suites passed (24/24).
- Production `CI=1 bun run build`: passed.
- Browser cleanup gate:
  - `agent-browser close --all`
  - `agent-browser session list` -> `No active sessions`
  - no `agent-browser` or `remote-debugging-port` process remained.
- Local screenshot count: 51, below the 100-image limit.

## Current-head trigger closure

- Re-ran the route after the global dynamic-event fix on
  `.synara-fidelity-editor-changes`.
- Trusted pointer input opened `New editor rail item`:
  - dialog: `240x123` at `(520,348.5)`;
  - `New chat` and `New terminal` rows: `214x34`.
- Trusted pointer input selected `New chat`.
- The menu closed and the real draft rail mounted at `384x728` with:
  - `New chat` header;
  - `What should we do in Editor Changes?`;
  - real permission/model/project composer controls.
- Relay remained connected with zero pending requests. No
  `orchestration.dispatchCommand` occurred during the trigger flow.
- Read-only SQLite verification after server shutdown still found exactly two
  durable threads in `editor-changes-project`; opening the draft did not create
  a thread.
- `lynx-editor-new-chat-trigger`: P2 route-specific interaction coverage,
  contribution `0.25 -> 0.00`.
- Real first send/provider promotion remains missing environment coverage and
  is not claimed.
- Evidence: `current-interaction/`.
