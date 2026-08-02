# Computer Use Native acceptance regression

## Isolation and ownership

- Date: 2026-08-02
- Server: isolated `127.0.0.1:62190`, home under
  `/private/tmp/synara-lynx-web-harness.SUyxxH/synara-home`
- Native state: isolated
  `/private/tmp/synara-lynx-web-harness.SUyxxH/native-user-data`
- Build: production Lynx/Desktop with `SYNARA_WS_URL=ws://127.0.0.1:62190`
- App: exact repository Lynxtron 0.0.7 path, launched with
  `SYNARA_BACKGROUND_LAUNCH=1` and `SYNARA_ALLOW_PARALLEL_INSTANCE=1`
- Computer Use targeted the full repository `.app` path. No `Raise` secondary
  action was invoked. Background presentation used macOS `showInactive()`.
- A different project's Lynxtron 0.0.8 remained running and was not touched.

## P0-A — Search

- Opened Search by a real background coordinate click.
- Focused the transparent command input and typed `Draft` through Computer Use.
- Results reduced to the real `Draft seed task` thread with project metadata and
  selected-row highlight; Enter navigated to that transcript.
- Popup retained the centered command surface, leading search icon, row icons,
  shortcuts/actions, horizontal footer layout and single-layer input anatomy.

Evidence: `search-filtered.jpeg`.

## P0-B — empty landing initiation and persistence

- Opened `New thread`, focused the real landing editor and typed
  `Reply exactly NATIVE-LANDING-PERSIST-OK and do not use tools.`
- Clicked Send once. The app promoted the landing draft to canonical thread
  `lynx-landing-thread-1785677631901-324479cc461478`, navigated to its transcript,
  and received the real provider response `NATIVE-LANDING-PERSIST-OK`.
- Expanded Chats and observed the new persisted row. Performed the one planned
  restart using the same isolated state; the route, user message, assistant
  response and Chats rows restored.
- Existing focused controller coverage supplies pending/duplicate-submit/error
  policy; this runtime pass exercised normal pending→complete and restart/LKG.

Evidence: `landing-restart-restored.jpeg`.

## Transcript and Markdown

- Opened the real long `Draft seed task` transcript and drove repeated native
  wheel pages to the final code section.
- Final `text` and `javascript` surfaces show language headers, wrap and copy
  actions, canonical user bubbles and the 80px trailing transcript inset above
  the aligned composer.
- Real clicks exercised wrap and copy. `pbpaste` matched
  `function greet(name = "World")`, proving the Native clipboard bridge received
  the canonical fenced source including its trailing newline.

Evidence: `markdown-actions.jpeg`; exact DevTool frame `devtool-current.png`.

## Console, restart and cleanup

- Final exact-owned DevTool target: `localhost:8904`, session `1`.
- `get-console --level error,warning --limit 200`: empty.
- Owned first process PID 1510 was stopped for the required persistence restart;
  final owned PID 6743/root 6739 was stopped after evidence. Port 8904 released.
- Other Lynxtron processes from `lynxtron-examples` remained running.
- The isolated server/browser harness remains available for resumed P9-D1 work.
- Clipboard side effect: the copied JavaScript fence is the current system
  clipboard value; the earlier clipboard value was not captured and could not
  be restored.
