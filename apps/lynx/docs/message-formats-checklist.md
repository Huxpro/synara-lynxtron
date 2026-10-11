# Transcript message formats: fixture and checklist

Every kind of transcript content, compared row by row between the Web original and the Lynx renderer. The comparison runs Lynx for Web against the Web original on one isolated server (see [verification-harness.md](verification-harness.md)), on a deterministic fixture thread, and measures the DOM / `<lynx-view>` shadow tree. The same threads are compared on the Native host against Electron with the desktop harness; see [Native against Electron](#native-against-electron).

## Fixture

`scripts/message-formats-fixture.mjs` clones the comparison seed (`.synara-desktop-comparison/fixture/seed`, built by `node scripts/comparison-fixture.mjs`) into an isolated `SYNARA_HOME` and appends hand-written events to the server's journal. The server replays them at startup, so both clients read the threads through the normal snapshot and stream path. No provider runs for these.

| Thread                          | Holds                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `message-formats-main-v1`       | User messages (plain, multi-line, `@` mentions, image and file attachment); every markdown feature; a turn with reasoning, narration, command / read / search / list / web search / MCP / file change rows and a failed command; the changed-files card; an answered question; a resolved approval; the proposed plan; an interrupted turn |
| `message-formats-failed-v1`     | A failed turn: failed command row and the error card                                                                                                                                                                                                                                                                                       |
| `message-formats-streaming-v1`  | An assistant message left streaming in the middle of a code fence                                                                                                                                                                                                                                                                          |
| `message-formats-approval-v1`   | Host for a pending approval (`--live`)                                                                                                                                                                                                                                                                                                     |
| `message-formats-user-input-v1` | Host for a pending two-question request (`--live`)                                                                                                                                                                                                                                                                                         |
| `message-formats-live-turn-v1`  | One real provider turn held running by its own approval request (`--live-turn`)                                                                                                                                                                                                                                                            |

Server startup settles running turns and pending requests (`startupTurnReconciliation.ts`), so those three states are added to the running server: the pending requests through the client `thread.activity.append` command, the running turn as a real Codex turn in approval-required mode.

## Running it

Pick an unused port offset and a home outside the repository; check `--dry-run` first.

```sh
HOME_DIR=/tmp/synara-message-formats   # isolated SYNARA_HOME
OUT=/tmp/synara-message-formats-out    # measurements and screenshots
node scripts/message-formats-fixture.mjs --home "$HOME_DIR" --rebuild
bun run --cwd apps/lynx build:web
env -u SYNARA_AUTH_TOKEN SYNARA_PORT_OFFSET=231 SYNARA_HOME="$HOME_DIR" SYNARA_NO_BROWSER=1 node scripts/dev-runner.ts dev:server   # prints serverPort / webPort
env -u SYNARA_AUTH_TOKEN SYNARA_PORT_OFFSET=231 SYNARA_HOME="$HOME_DIR" SYNARA_NO_BROWSER=1 node scripts/dev-runner.ts dev:web
node scripts/message-formats-fixture.mjs --live ws://127.0.0.1:<serverPort>
node scripts/message-formats-fixture.mjs --live-turn ws://127.0.0.1:<serverPort>        # optional, real provider turn

export MESSAGE_FORMATS_WEB_PORT=<webPort> MESSAGE_FORMATS_OUT="$OUT"
C=apps/lynx/scripts/message-formats
bun run browser:run -- $C/capture.sh web  message-formats-main-v1 dark main 8
bun run browser:run -- $C/capture.sh lynx message-formats-main-v1 dark main 8
node $C/merge.mjs "$OUT/out" main-web-dark && node $C/merge.mjs "$OUT/out" main-lynx-dark
node $C/compare.mjs "$OUT/out" main dark
node $C/offsets.mjs "$OUT/out/main-web-dark.0.raw" "$OUT/out/main-lynx-dark.0.raw" "Heading level one" 30

# expanded work log (scroll offsets differ: the Web list is virtualized)
CLICK_TEXT="Worked for 13s" START_TOP=1900 bun run browser:run -- $C/capture.sh web  message-formats-main-v1 dark expanded 2
CLICK_TEXT="Worked for 13s" START_TOP=2300 bun run browser:run -- $C/capture.sh lynx message-formats-main-v1 dark expanded 2

node scripts/message-formats-fixture.mjs --stop-live-turn ws://127.0.0.1:<serverPort>
```

Repeat `capture.sh` for the other threads (one screen each) and for `light`. Stop both dev runners afterwards and check that their ports are free; a dev runner can leave its server or Vite child behind.

- `compare.mjs` prints row heights for both clients, then each text block matched by text with its size and style deltas, then blocks only one client drew.
- `offsets.mjs` prints the vertical offset of each block after an anchor. Use it for spacing: row tops shift in the virtualized Web list, offsets inside one scroll step do not.
- Screenshots land in `$OUT/shots/<label>-<client>-<theme>-<step>.png`.

## Checklist

State on the default chat font size (13px), 1280×820. "Matches" means the same text and structure and at most 2px on the row height.

| Content                                                                        | State                                                                                                                                   |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| User message: plain, multi-line, markdown inside the bubble                    | Matches                                                                                                                                 |
| User message: `@` file mention chips                                           | Matches                                                                                                                                 |
| User message: file and image attachments                                       | Matches (file pill, image thumbnail); the expanded image preview is not ported                                                          |
| User message: pasted link                                                      | Open: the chip shows the whole address, Web shortens it (`example.com/pasted`)                                                          |
| User message: hover footer (timestamp, copy, edit, revert)                     | Matches                                                                                                                                 |
| Markdown: headings, bold / italic / strikethrough, inline code, links          | Matches                                                                                                                                 |
| Markdown: lists (nested, ordered, loose), task lists, blockquote, rule, `<br>` | Matches                                                                                                                                 |
| Markdown: GitHub alerts (`> [!NOTE]`)                                          | Matches                                                                                                                                 |
| Markdown: table                                                                | Alignment and row heights match; column widths are approximated (Lynx has no table layout), within about 25px                           |
| Markdown: fenced code (languages, no language, long line, header, wrap / copy) | Matches                                                                                                                                 |
| Markdown: file reference chips                                                 | Match for files; a reference to a file that does not exist is still drawn as a chip (Web keeps it as inline code)                       |
| Markdown: math                                                                 | Missing: shown as source text, Web typesets it with KaTeX                                                                               |
| Markdown: image                                                                | Missing: shown as an `[image: alt]` placeholder                                                                                         |
| Streaming message with an open code fence                                      | Open: 2.2px short on both hosts (code block's bottom margin and the action-less footer, see Native below)                               |
| Collapsed work ("Worked for Ns") and its expanded state                        | Matches; a reasoning line is drawn as markdown (a file name becomes a chip), Web draws it as plain text                                 |
| Tool rows (command, read, search, list, web search, MCP, file change, failed)  | Same sentences; the leading glyph is generic and the chevron sits at the row end                                                        |
| Changed-files card                                                             | Totals, Review and one row per file match; Undo, the collapse control and per-file inline diff are missing; the header glyph is missing |
| Answered question (user-input exchange)                                        | Matches                                                                                                                                 |
| Proposed plan card                                                             | Matches; the card's action menu is missing                                                                                              |
| Failed turn                                                                    | Row and card match; Continue task and Change model are missing                                                                          |
| Interrupted turn                                                               | Matches                                                                                                                                 |
| Running turn                                                                   | "Working for Ns" header matches; live tool rows are 4–6px shorter per row; the Thinking row has no glyph                                |
| Pending approval panel                                                         | Open: same options, different metrics and an extra footer line                                                                          |
| Pending user-input panel                                                       | Open: has its own answer field and step label instead of the Web composer hand-off                                                      |
| Assistant actions (copy, fork, pin, timestamp)                                 | Matches                                                                                                                                 |

Sidechat-origin markers, terminal context blocks, pasted-text and pull-request context cards, browser annotations, quoted assistant selections, hub work items, computer-control cards and automation cards are not in the fixture.

## Native against Electron

The browser pair says nothing about the Native text engine. The desktop launcher takes the fixture with `--message-formats`: after cloning the canonical seed into its isolated home it appends the fixture's events to that clone (never to the seed), the backend projects them at startup, and the launch certifies on the canonical thread as usual. The data freeze then starts from what the backend exposed before either renderer attached, because the journal is longer than the seed's. `scripts/message-formats-desktop.mjs` opens a fixture thread from the sidebar in both renderers and prints, per transcript row, both heights, the text blocks whose offset or size differ, and the labeled controls inside the row (`labeledControls` / `compareControls` of the cell matrix, relative to the row).

```sh
bun run compare:desktop --width 1280 --height 820 --theme dark --lynx-devtool-port 8915 --message-formats   # wait for "Run manifest"
PORT=$(node -e 'console.log(require("./.synara-desktop-comparison/runs/latest.json").backend.port)')
node scripts/message-formats-fixture.mjs --live "ws://127.0.0.1:$PORT/?token=synara-local-desktop-comparison"   # pending approval and question
node scripts/message-formats-desktop.mjs --thread main --out "$OUT" --blocks --shots --window
node scripts/message-formats-desktop.mjs --thread failed --out "$OUT" --blocks --shots --window      # also: streaming, approval, userInput
# stop the launcher with SIGINT and wait for "Cleanup verified"
```

- Run the standard cell matrix and the workflows on a launch without `--message-formats`: the extra threads change the sidebar.
- The measurer travels on Native through the message trail (one stop per user message), not by dragging. A DevTool finger drag is a press and a move, and on this desktop host a press and a move that start on selectable message text (`<text text-selection>`: assistant markdown and user bubbles) select the text instead of panning the list, as a mouse drag does. Its short drags for rows taller than the viewport start in the gutter beside the message column.
  - Until 2026-10-10 that gesture also sent the list to its top in one scroll event (`scrollTop` 4928 → 4, `eventSource` 2), with real mouse input too. The engine reveals the moving end of a selection in the nearest scroll-view ancestor of the text (`TextView::BringIntoView` in `clay/ui/component/text/text_view.cc`) and uses a position measured inside the text element as an offset in that scroller's content; for a paragraph in a transcript row the scroller was the list and the offset a few pixels. Selectable markdown now sits in a scroll-view of its own that cannot scroll (`textSelectionScrollScope.logic.ts`), so the reveal ends there. Workflow J2 selects reply text by dragging and fails if the transcript moves.
  - A wheel or trackpad scroll has no press, so it never took this path.
  - Row estimates are about twice the real height for long markdown answers (1950 against 831 for the first answer; `scrollHeight` 6191 before the rows are measured, 3941 after). The list corrects its offset as each row is bound, so nothing jumps, but the scroll indicator's thumb grows while scrolling up.
- `--click-text "Worked for 13s"` expands a work log first. It works on Native; the Electron click does not land yet, so the expanded state has no Native ↔ Electron numbers.

Row heights at 1280×820, dark, default chat font size (Electron / Native before / Native after the fixes of this pass). Light gives the same heights on the main and failed threads.

| Row                                                   | Electron | Before | After | Result                                                                                                    |
| ----------------------------------------------------- | -------: | -----: | ----: | --------------------------------------------------------------------------------------------------------- |
| User: plain                                           |     84.1 |     84 |    84 | Matches                                                                                                   |
| Assistant: inline markdown, lists, quote, alert, math |    842.5 |    829 |   831 | −11.5: display and inline math are source text (−10.9); the rest is −0.7                                  |
| User: multi-line with markdown and pasted link        |      188 |    187 |   188 | Matches; the bubble is 46px wider (the link chip shows the whole address)                                 |
| Assistant: table, code blocks, file chips, image      |   1362.6 |   1229 |  1233 | −129.6: image placeholder (−116), no horizontal scrollbar under the long line (−10), line rounding (−2.7) |
| User: `@` mentions                                    |     84.1 |     84 |    84 | Matches                                                                                                   |
| Assistant: collapsed work, text, changed-files card   |    320.1 |    323 |   322 | Matches (+1.9)                                                                                            |
| User: file and image attachment                       |    186.1 |    186 |   186 | Matches in size; the image thumbnail shows the file icon                                                  |
| Assistant: one paragraph                              |     59.1 |     59 |    59 | Matches                                                                                                   |
| Answered question                                     |    167.9 |    168 |   168 | Matches                                                                                                   |
| Proposed plan                                         |    334.1 |    330 |   333 | Matches (−1.1)                                                                                            |
| Assistant: collapsed work and one paragraph (×2)      |    103.1 |    104 |   103 | Matches                                                                                                   |
| Failed turn: failed command row                       |       32 |     32 |    32 | Matches                                                                                                   |
| Failed turn: error card                               |    123.6 |    124 |   124 | Matches; Continue task and Change model are missing                                                       |
| Streaming message with an open code fence             |    187.2 |    191 |   185 | −2.2: see below                                                                                           |
| Pending approval and pending question hosts           |     59.1 |     59 |    59 | Rows match; the panels are the open items of the checklist above                                          |

Controls inside rows (copy, fork, pin, revert, edit, code-block wrap and copy): 30 of 30 within 2px on the main thread after the fixes (21 of 30 before).

What differed on Native only, and where it is handled:

- **A line with inline code is 1px taller in Chromium.** Native keeps the paragraph's line height. `.MdText--inline-code` adds the pixel to paragraphs and table cells that hold a code span; the web host removes it (`webHostStyleOverrides.logic.ts`).
- **A 19.5px line is laid out as 20px.** The collapsed-work trigger and the changed-files summary now have upstream's box height instead of a height derived from their text.
- **Line height 21.125px is laid out as 21px.** A block is 0.125px shorter per text line, so a row drifts 1px every eight lines. Platform limit; it is what remains in the long rows above.
- **No classic scrollbar.** Electron reserves 10px under a code block whose line overflows; Lynx overlays its indicator. Platform limit, the same as the matrix's scrollbar-gutter exemption.

Shared defects found on the way (also wrong on Lynx for Web): long sidebar thread titles wrapped onto the next row (now one line), and work entries inside a message row had 6px above and below (upstream has `mb-1.5` before the text and `mt-1.5` after it).

Closed since (2026-10-10): mention and file chips take the text's size (`1em`; Native does not take `inherit` there), nested list markers are drawn as shapes, and a thread waiting on an approval shows upstream's "Pending" word and 6px state dot.

Still open on Native:

- Streaming message (−2.2): upstream's code block keeps its 10.4px bottom margin as the last child of `.chat-markdown` (its rule comes after `> :last-child`), and its footer without actions is 17.9px; Lynx drops the margin and keeps the footer at 24px.
- The user image thumbnail falls back to the file icon.

## Chat follow acceptance (#76)

The follow controller now reserves animated settling for inactive turns; provider pauses while a turn is running keep immediate end-follow. Lower-threshold events use the existing user-scroll and live-edge gate and cannot independently reattach a detached reader. See [the report and raw measurements](../plan/reports/chat-76-follow/README.md).

The final dark 1440×900 / 13px run passed thread and appearance cells, J1 excluding only Stop, five consecutive paired J2 repetitions, and J7 on both renderers. #35 remains excluded and unfixed. The current real-provider fixture was measured row by row without database injection: four of eight rows are outside 2px (+2.4, +2.1, −8.7, −5px on assistant rows), and 12 of 23 paired controls are outside 2px. These remain open for #85/#86 and are not platform exemptions. This does not supersede the full eight-configuration format audit or the final matrices.

## Chat parity execution status (2026-10-11)

The historical “Matches” entries above describe their original fixtures/configurations; they are not an eight-configuration Native acceptance certificate.

| Issue | Current result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #76   | Merged in [PR #91](https://github.com/Huxpro/synara-lynxtron/pull/91); follow checks in the report above.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| #85   | Two row-pairing approaches failed on virtualized content. Prototype reverted; [blocker and missing coverage](https://github.com/Huxpro/synara-lynxtron/issues/85#issuecomment-6105706802). No complete row fixture or eight-configuration certificate.                                                                                                                                                                                                                                                                                                                                                                                                              |
| #77   | Two optimistic-send approaches failed full acceptance. Prototype reverted; [latency evidence and remaining work](https://github.com/Huxpro/synara-lynxtron/issues/77#issuecomment-6105877917). Existing-thread Native observation reached 118.5ms; first-send observation did not prove ≤200ms.                                                                                                                                                                                                                                                                                                                                                                     |
| #78   | Native app toast surface implemented; [measurements and validation](../plan/reports/chat-78-toast/README.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| #86   | Terminal-spacing approaches both failed: transient Native bottom gaps 27px / 38–40.22px against settled 80px. Prototype reverted; [blocker and remaining work](https://github.com/Huxpro/synara-lynxtron/issues/86#issuecomment-6106833182). Partial typography improvements were also reverted.                                                                                                                                                                                                                                                                                                                                                                    |
| #82   | Approval/question controls and composer answer handoff verified in dark 1440×900, chat size 13: 9/9 controls within 1.4px; paired fixture workflows pass. [Evidence](../plan/reports/chat-82-decision-panels/README.md). Paired J1 excluding Stop, J2 rerun, and J7 pass; [PR #93](https://github.com/Huxpro/synara-lynxtron/pull/93) squash merged after 25 CI successes / 1 conditional skip; issue closed. Initial J2 selection-toolbar failure retained.                                                                                                                                                                                                        |
| #83   | Card actions implemented; dark 1440×900 / 13px: plan 3/3, failed turn 3/3, changed files 9/9 controls within 0.75px. Paired copy/download, recovery with draft preservation, path-copy menus and loaded checkpoint review pass. [Evidence and retained harness failures](../plan/reports/chat-83-transcript-card-actions/README.md). Thread at matched end position passes 42/46 plus four named trail exemptions; paired J1 excluding Stop/J2/J7 pass once. OS dialogs/external-editor physical validation remains unverified; [PR #94](https://github.com/Huxpro/synara-lynxtron/pull/94) squash merged after 25 CI successes / 1 conditional skip; issue closed. |
| #84   | Five context fixtures use upstream visible-text projection. Dark 1440×900 / 13px: seven states, 26/26 controls, maximum row-height difference 1.5px; paired visible-copy/edit-cancel passes. [Evidence and retained failures](../plan/reports/chat-84-user-contexts/README.md). Thread passes 41/45 plus four existing trail exemptions; canonical formats improve to 5/8 rows (remaining +2.1/−8.7/−5px), 19/30 controls. [PR #95](https://github.com/Huxpro/synara-lynxtron/pull/95) squash merged after 26 CI successes / 1 conditional skip; issue closed. Final eight configurations remain open.                                                              |
| #81   | Two image layout approaches failed: downloaded wide/tall row deltas +8.4px / +20.3px. Rolled back; [blocker and missing states](https://github.com/Huxpro/synara-lynxtron/issues/81#issuecomment-6108580816). These are unresolved differences, not platform exemptions.                                                                                                                                                                                                                                                                                                                                                                                            |
| #87   | Two physical Select All approaches failed; keyboard search also unproven. Rolled back; [background input evidence and remaining work](https://github.com/Huxpro/synara-lynxtron/issues/87#issuecomment-6108814377).                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| #89   | Attachment handoff, shared-token ownership, persisted per-provider selections and coordinator guards implemented. Native background right-click busy/failure paths pass; Lynx for Web J7 passes, paired Web original remains blocked at its new-thread entry. [Evidence and remaining scope](../plan/reports/chat-89-handoff/README.md). Final Native units 428/1809 pass; thread 41/45 plus four named exemptions; paired J1 excluding Stop/J7 and J2 rerun pass once. Initial Electron J2 anchor failure retained. [PR #96](https://github.com/Huxpro/synara-lynxtron/pull/96) awaits CI and squash merge.                                                        |
| #35   | Recorded only; Stop remains excluded from J1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

The #78 run measured the existing real-provider transcript, without SQLite fixture injection: 4/8 row heights and 11/23 paired controls within 2px. Remaining row deltas are +2.4, +2.1, −8.7 and −5px. These are open differences, not platform exemptions. The full row-type fixture, eight configurations, 24/24 and 28/28 matrices, and final three consecutive paired workflows remain outstanding.
