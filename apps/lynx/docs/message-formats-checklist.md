# Transcript message formats: fixture and checklist

Every kind of transcript content, compared row by row between the Web original and the Lynx renderer. The comparison runs Lynx for Web against the Web original on one isolated server (see [verification-harness.md](verification-harness.md)), on a deterministic fixture thread, and measures the DOM / `<lynx-view>` shadow tree. It does not use the desktop comparison harness.

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
| Streaming message with an open code fence                                      | Matches                                                                                                                                 |
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
