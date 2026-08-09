# Environment local-status parity

- Owned harness: server `58700`, Web `9463`, isolated home
  `.synara-git-local-final`, server instance
  `4071bf9d-4a76-44a5-88aa-c568090b724b`.
- Canonical product fixture: project `project-git-stable`, thread
  `thread-git-stable`, workspace `/tmp/synara-env-local-status-fixture`.
- The workspace is a local Git repository with no remote. `README.md` has one
  fixed line replacement, so all clients read exactly `+1 / -1`.
- `git.statusLocal` returned the local working-tree snapshot in `480ms`.
  The RPC uses `GitCore.statusDetails(..., { refreshRemote: false })`; focused
  tests prove it does not invoke the complete remote status path.
- Web and Lynx-for-Web use the same snapshot, route, `1280x480` viewport,
  DPR 1, and light/dark themes. All four PNGs are exactly `1280x480`, and all
  four page-error arrays are empty.
- Every cell resolves the Environment surface to
  `x=980, y=58, width=288, height=410`, content/viewport to `427/408`, and
  top/middle/bottom positions to `0/10/19`.
- The Branch block now follows Web's two-row anatomy (`Local`, then `main`)
  with a 2px gap. The Notepad field is 4px taller. Together these close the
  previously measured 15px content-height residual.
- Lynx relay diagnostics show one connection, zero pending requests, no
  transport error, and `git.statusLocal` in the real request list.
- Browser automation reused one session per verification run. Every temporary
  session was explicitly closed; the final session list was empty, and no
  owned `.pid`, session metadata, or `agent-browser-chrome-*` profile remained.
