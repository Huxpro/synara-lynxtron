# Explorer directory tree current-head evidence

- Isolated server: `ws://127.0.0.1:58870`; trusted Lynx-for-Web origin: `http://127.0.0.1:9514`; server instance `382d0709-27ea-472e-91a0-fb977a4e1593`.
- Canonical RPC-created `project-tree-final2` / `thread-tree-final2` use workspace `/private/tmp/synara-explorer-tree-final`.
- One named browser session `explorer-tree-final`, viewport `1280x820`, DPR 1.
- Real low-level mouse clicks expanded `src`, then `src/nested`, then collapsed `src`.
- URL target state used Web-only repeated `explorerExpanded` parameters; Native keeps the original `bindtap` controller.
- Expanded tree: root `src` at 8px left padding, `nested`/`tree.ts` at 22px, `deep.ts` at 36px; every row is 28px high.
- Light and dark geometry is identical. Tree rows are now single-line like Web instead of duplicating `docsdocs` / `srcsrc`.
- Relay recorded three `projects.listDirectories` calls (root, `src`, `src/nested`), one connection, no transport error, and zero pending requests.
- The provider-list error is the isolated harness's known missing `codex` PATH limitation and does not affect Explorer RPCs.
- `page-errors.txt` is empty. Browser console contains only the known upstream custom-element initialization warning plus host setup logs.
- Both PNGs are exactly `1280x820`.
- Cleanup: canonical delete advanced the final snapshot to sequence 4 with zero
  live projects/threads; the named browser session, owned server/static ports,
  isolated home, and temporary workspace were removed.
