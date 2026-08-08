# Environment Pull Request evidence

- Server: `ws://127.0.0.1:58155`
- Server instance: `0a735352-e0f2-401b-ad08-28939d9f0a67`
- Web origin: `http://localhost:8998`
- Client: Lynx-for-Web production bundle
- Viewport: 1280×820, DPR 1; PNG: 1280×820
- Theme: light
- PR: real upstream `Emanuele-web04/synara#540`
- Worktree: temporary detached checkout of `refs/pull/540/head`; removed after
  capture together with the temporary local ref
- Fixture: canonical project/thread create sequences 58/59; thread/project
  delete sequences 60/61; active fixture projections after cleanup: 0/0
- Pull request: `feat(web): improve sidechat and keybinding workflows`
- Diff: +681, −130, 19 files
- Mergeability: conflicting with `main`
- Checks: nine real GitHub checks; one failing
- Comments: zero unresolved comments
- PR section: 274px rows for title, diff, conflict, checks, and comments
- Checks popup: 987,516,288×282; nine rows at 274×28
- Reliability: mounted PR refresh uses one serialized host polling loop rather
  than React Query observer timers. A real GitHub refresh transiently failed,
  the visible Retry state appeared, and the serialized path subsequently
  loaded the real snapshot without concurrent requests.
- Relay after settle: WebSocket OPEN, one connection attempt, zero pending
  requests, no transport or RPC error
- Page errors: none
- Console: known upstream Lynx-for-Web initialization deprecation warning only
- Native/Desktop staged bundle:
  `1ddf803302985813250c1320034e7db6571e9778c96607ed2d32e67329b9aafa`
