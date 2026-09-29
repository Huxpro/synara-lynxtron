# Editor Chat history fidelity loop

## Scope

- Screen: Editor view, Chat rail header.
- State: two active threads in the same project, Changes mode, chat visible.
- Theme / viewport: light, 1280 x 820, DPR 1.
- Authority: Web original at `http://127.0.0.1:9130/editor-changes-thread?view=editor`.
- Lynx-for-Web: `http://localhost:8080/web-host?route=/thread/editor-changes-thread&editor=open&editorMode=diff&editorHistory=open`.
- Shared isolated state: `.synara-fidelity-editor-changes`, server `127.0.0.1:59260`.

## Canonical state

A second thread was created through `orchestration.dispatchCommand` (no SQLite writes):

- `editor-changes-thread` — `Editor changes review` (active authority thread)
- `editor-history-thread` — `Review chat history navigation`

Read-only SQLite inspection was used only after a harness discrepancy to confirm both projection rows remained active.

## Web authority

- Real `Chat history` button opened the Web Menu.
- Menu geometry: `288 x 62` at `(833, 84)`; two 26px rows.
- Ordering followed sidebar updated-time ordering: `Review chat history navigation` first, active `Editor changes review` second.
- Non-active row showed relative time; active row used the selected marker.
- A real rendered menu-item click navigated to `/editor-history-thread?view=editor`, preserving Editor view and updating the header identity.
- Evidence: `web-history-open-1280x820-light.png` (`1280 x 820`).

## Lynx implementation and result

- Added a 30-item, project-scoped history projection using the shared `sortThreadsForSidebar` helper and shared `formatRelativeTime` formatter.
- Full-shell thread summaries now preserve active zero-message threads for route/history use; archived threads are excluded.
- Added a fixed modal with backdrop, Escape handling, close action, dialog accessibility, loading state, responsive width, provider identity, active marker, and relative time.
- `DialogView` / `DialogContent` and the earlier Menu experiment both produced an empty overlay under the full-screen Editor fixed root in Lynx-for-Web. The retained implementation is an intentional platform delta: it reuses existing color/radius tokens and interaction semantics without the incompatible Lynx UI overlay wrapper.
- Deterministic `editorHistory=open` startup is supported by Web host and Native deep-link parsing for verification only.
- Valid Lynx-for-Web cell:
  - exact relay configured/active at `ws://127.0.0.1:59260`
  - canonical `orchestration.getShellSnapshot` observed
  - dialog geometry `420 x 156` at `(430, 332)`
  - rows: `Review chat history navigation · 1h`, then `Editor changes review · ✓`
  - evidence: `lynx-web-history-open-1280x820-light.png` (`1280 x 820`)

## Classification

| Item                                                 | Classification                            | Result                                                                                                                                           |
| ---------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Missing Lynx Editor Chat-history entry and list      | product loss, P2 (`0.25`)                 | closed for presentation/data/navigation contract                                                                                                 |
| Web menu navigation preserving `view=editor`         | authority behavior                        | passed by real rendered click                                                                                                                    |
| Lynx-for-Web history row click                       | historical dynamic-event blocker          | this cell was not reclassified as a pass; the global blocker was closed later, but this history-row interaction still needs a current-head rerun |
| Initial `58090` relay despite isolated `59260` build | harness loss                              | fixed: Web host now consumes the compile-time isolated endpoint                                                                                  |
| Initial WS rejection from `localhost:8080`           | harness origin mismatch                   | fixed by phase-specific server `--dev-url http://localhost:8080/`; security policy unchanged                                                     |
| Empty Dialog UI overlay in fixed Editor root         | intentional platform implementation delta | replaced with stable fixed modal; visible/data contract passed                                                                                   |
| Native navigation interaction                        | missing certification coverage            | not claimed; user-owned PID `77846` / DevTool `8901` remained untouched                                                                          |

## Validation

- Focused Rstest: 27/27 passed across Editor history projection, shell projection, Editor contract, relay endpoint, and desktop deep-link suites.
- `CI=1 bun run build` in `apps/lynx`: passed. Existing warnings only: unsupported `color-scheme` / `overflow-wrap`, optional `bufferutil` / `utf-8-validate`.
- Screenshot count after retained captures: 49 (under the 100-image limit).

## Current-head interaction closure

- Re-ran the route after the global dynamic-event fix on the same
  `.synara-fidelity-editor-changes` snapshot.
- Trusted pointer input opened the real `Chat history` trigger:
  - dialog: `420x156` at `(430,332)`;
  - non-active row: `Review chat history navigation`;
  - active row: `Editor changes review`.
- Trusted pointer input selected the non-active row.
- The dialog closed and the Editor composition remained mounted.
- A separate current-thread oracle read the real sidebar projection:
  - active thread label became `Review chat history navigation`;
  - `ThreadEditorHistoryDialog` was absent;
  - `ThreadEditorView` remained present;
  - relay stayed connected with zero pending requests.
- The relay's `provider.listModels` error is the known isolated-environment
  `codex not found in PATH` noise and did not affect navigation.
- `lynx-editor-chat-history-row-interaction`: P2 route-specific coverage,
  contribution `0.25 -> 0.00`.
- Evidence: `current-interaction/`.
