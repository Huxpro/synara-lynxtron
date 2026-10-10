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
- The measurer travels on Native through the message trail (one stop per user message), not by dragging. On the main fixture thread a DevTool finger drag that brings an unmeasured tall row into range sends the list to its top, and at the top a downward drag does not move it. Not yet reproduced with a real wheel; tracked in the issue.
- `--click-text "Worked for 13s"` expands a work log first. It works on Native; the Electron click does not land yet, so the expanded state has no Native ↔ Electron numbers.

Row heights at 1280×820, dark, default chat font size (Electron / Native before / Native after the fixes of this pass). Light gives the same heights on the main and failed threads.

| Row                                                   | Electron | Before | After | Result                                                                                                    |
| ----------------------------------------------------- | -------: | -----: | ----: | --------------------------------------------------------------------------------------------------------- |
| User: plain                                           |     84.1 |     84 |    84 | Matches                                                                                                   |
| Assistant: inline markdown, lists, quote, alert, math |    842.5 |    829 |   831 | −11.5: display and inline math are source text (−10.9); the rest is −0.7                                  |
| User: multi-line with markdown and pasted link        |      188 |    187 |   188 | Matches; the bubble is 46px wider (the link chip shows the whole address)                                 |
| Assistant: table, code blocks, file chips, image      |   1362.6 |   1229 |  1233 | −129.6: image placeholder (−116), no horizontal scrollbar under the long line (−10), line rounding (−2.7) |
| User: `@` mentions                                    |     84.1 |     84 |    84 | Matches; chip labels are 11px instead of 13px                                                             |
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

Still open on Native:

- Streaming message (−2.2): upstream's code block keeps its 10.4px bottom margin as the last child of `.chat-markdown` (its rule comes after `> :last-child`), and its footer without actions is 17.9px; Lynx drops the margin and keeps the footer at 24px.
- Mention and file chips ignore `font-size: inherit` and stay at the base token's 11px.
- The user image thumbnail falls back to the file icon.
- The sidebar row of a thread with a pending approval has no "Pending" label.
- Nested list markers: the hollow circle and the square are drawn as a small dot and a faint box.
