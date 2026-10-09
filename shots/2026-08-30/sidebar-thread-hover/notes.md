# Sidebar thread hover metadata parity

- Shared backend `64101`, light theme, `864x620`, project `github`.
- Electron source: exact CDP target `10330`; Native: exact-owned Lynxtron 0.0.16 PID/window `50250/17410`.
- The fixture `fidelity-hover-thread-20260830` was created through `orchestration.dispatchCommand` sequence `250`, not by editing SQLite. It used title `Hover metadata fidelity specimen`, `envMode: worktree`, branch `feature/sidebar-hover`, and associated worktree path ending in `sidebar-hover-card`.
- Both cards visibly contain title/relative time, project `github`, branch `feature/sidebar-hover`, and worktree `sidebar-hover-card`. Native consumes Electron's shared `resolveThreadHoverCardMetadata` policy.
- Evidence: `electron-hover.png`, `lynx-hover.png`, and their `1020x430` focused crops. Electron capture is CDP evidence; Native interaction and exact-window capture use Computer Use/window capture and are not conflated with CDP.
- Fixture cleanup used canonical `thread.delete` sequence `251`; no direct SQLite mutation was used.
- Focused Rstest: 19/19 passed. ReactLynx scans for `Sidebar.lynx.tsx` and `queries.ts`: 0 issues. Lynx/Desktop production build: passed.
- Staged `main.lynx.bundle` SHA-256: `6b335c831c321c72d8a9004fe4d28be975696873954431644556b7ef69f63d61`.
