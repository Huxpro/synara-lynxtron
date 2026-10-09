# Expanded Thinking parity — long multi-tool/code specimen

- Source of truth: Electron `Synara (Dev)` PID/window `86061/16706`.
- Native: exact-owned Lynxtron 0.0.16 PID/window `88376/16718`; unrelated PID `37522` was not touched.
- Shared backend: `56558`; thread: `lynx-landing-thread-1787254540864-987357febecef`; route: thread detail; theme: light; requested window: `864x620`.
- Both full captures are normalized to `1728x1240` at DPR 2. Focused crops are `1200x720`.
- Matched visible state: `Worked for 5m 21s` expanded, `Read 1 file, 1 other tool call` expanded, transcript scrolled to the JavaScript fenced block.
- Verified Native details: iconless reasoning Markdown; 11px/19px muted reasoning and 12px/19px narration; semantic search/read glyphs; grouped-tool count and chevrons; truncated long path; JavaScript language label; host-side Shiki colors; wrap/copy controls; code padding, radius, background, and separator.
- Evidence: `electron-final.png`, `lynx-final.png`, `electron-final-crop.png`, and `lynx-final-crop.png`.
- Focused Rstest: 21/21 passed. ReactLynx best-practices scan: 0 issues. Lynx/Desktop production build: passed.
- Staged artifacts: `main.lynx.bundle` `9dd44751da186397a18a20db5c0915e1badab0c0d6ab2e4152c88fe7f4c677bc`; `main.js` `9c07a8d4c0d0eb5dce928c082bbc80f1b99ff0f10fb59e5fa7517a50c9f616f7`; `search-key-monitor.node` `6b779af991e327a3bf4ecc04d85a5261b42ca1005f0c7760a1b17c1833d56e64`; `browser-view-probe.node` `8fc83f666b3247d04886f7693b85bfb73803329f098888c11c92624ec1e6aa86`.
- DevTool did not register this exact-owned client, so no DevTool screenshot/console is claimed. Computer Use supplied the exact-window interaction evidence; the launcher log showed the real `host.syntaxHighlightCode` request and no runtime exception. This is recorded as a harness residual, not a product failure.
- Short edit-only source data: turn `01a020b3-1d61-7291-98b9-2d5e9d35510f`, containing one `Reasoning trace` (`Planning simple hello.js creation`) and one completed `file_change` for `example.js`.
- Short edit-only matched run: backend `49597`; Electron PID/window `75142/16922`; Native PID/window `77845/16930`; same thread, route, light theme, and `864x620` window. Evidence: `electron-edit-only.png`, `lynx-edit-only.png`, and their focused crops.
- The first Native capture exposed `File change` instead of Electron's `Edited example.js`. Native now reuses Web's `isFileChangeWorkLogEntry` plus the shared basename helper, and the fresh production bundle visibly renders the pencil icon with `Edited example.js`.
- Final focused Rstest: 22/22 passed. Both changed ReactLynx surfaces scan with 0 issues. Final staged `main.lynx.bundle`: `929666c9de4af7430b42c7bed7a9462a7d06095b7819847291a7ec8dc6f5d289`.
