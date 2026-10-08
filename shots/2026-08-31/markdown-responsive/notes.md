# Markdown table responsive evidence

- Matched cell: `864x620`, light theme, Terminal dock open, same isolated backend `56694` and short `thread.handoff.create` fixture `markdown-proof-1788173961321`.
- Fixture: one imported assistant message containing a three-column GFM table, long unbroken path/result values, and a fenced TypeScript block. No SQLite writes.
- Electron source geometry: right dock `x=449`, `width=415`; table `x=280`, `width=134`, `clientWidth=scrollWidth=134`; fenced code viewport `width=134` with its intentional local horizontal overflow (`clientWidth=134`, `scrollWidth=1491`); body `clientWidth=scrollWidth=864`. The screenshot is `1728x1240` at DPR 2.
- Native evidence: `lynx-narrow-table.png`, exact-owned PID/window `94014/19739`. The owned process and Electron renderer both had established sockets to backend `56694`. Name, Path, and Result render simultaneously; long values wrap inside their columns; the table does not widen the chat pane; code remains locally bounded.
- Harness improvement: comparison runs copy Lynxtron to `.synara-desktop-comparison/runtime/Synara Comparison Lynxtron.app`, rewrite its bundle id to `com.lynxjs.SynaraComparisonLynxtron`, and ad-hoc resign it. Computer Use can now target the owned app without falling back to other `com.lynxjs.Lynxtron` instances. Launcher tests pass 17/17.
- Focused Markdown test: 5/5. ReactLynx scans: zero issues for `ChatMarkdown.lynx.tsx` and `Transcript.tsx`. Lynx/Desktop production build passed.
- Final runtime-pinned bundle SHA-256 for the retained visual cell: `2520165575e086edb84a8101561cb939b3a72ec85364a35220a77920c9c2cc75`.
