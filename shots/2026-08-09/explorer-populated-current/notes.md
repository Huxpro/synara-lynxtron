# Explorer populated current-head evidence

- Server: isolated Synara `ws://127.0.0.1:58180`
- Web origin: isolated Vite `http://localhost:9002`
- Server instance: `699fc6d1-6043-428a-810c-7bb7496d843c`
- Snapshot before cleanup: sequence `2`
- Route: `/thread/thread-explorer-data`
- Workspace: `/private/tmp/synara-explorer-data-fixture`
- Lynx-for-Web route state: Explorer open, `README.md` selected, width `760px`
- Viewports: `1280×820` DPR 1 light/dark; `900×700` DPR 1 narrow
- PNG dimensions match all requested cells exactly.
- Light/dark both render `docs`, `src`, and `README.md`, selected README Markdown,
  dock width `760px`, and matching `ThreadPage` padding.
- Light dock resolves to `rgb(255,255,255)` / `rgb(13,13,13)`.
- Dark dock resolves to `rgb(16,16,16)` / `rgb(252,252,252)`.
- Narrow dock clamps to `580px`, preserving the `320px` minimum main content,
  `240px` Explorer sidebar, and `339px` preview.
- Retained relay diagnostics include `projects.listDirectories` and
  `projects.readFile`, one connection attempt, zero pending requests, and no
  transport error.
- The recorded RPC error is an isolated-harness provider discovery limitation:
  `codex` is absent from the inherited PATH. It does not affect Explorer RPCs.
- Bundle hashes are recorded in `bundle-sha256.txt`.
- Cleanup result is recorded after canonical fixture deletion and owned-process
  shutdown.

- Cleanup: canonical thread/project delete advanced snapshot sequence to `4`; named browser closed; owned `58180/9002` ports released; symlink, isolated home, and temporary workspace removed.
