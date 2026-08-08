# Environment composition evidence

- Server: `ws://127.0.0.1:58155`
- Server instance: `0a735352-e0f2-401b-ad08-28939d9f0a67`
- Web origin: `http://localhost:8998`
- Client: Lynx-for-Web production bundle
- Viewport: 1280×820, DPR 1; PNG: 1280×820
- Theme: light
- Fixture: canonical project/thread create sequences 66/67; thread/project
  delete sequences 68/69; active fixture projections after cleanup: 0/0
- Authority order:
  Changes → Branch → Local Servers → Usage → Repository → Pull request →
  Editor → Recap → Pinned → Markers → Project instructions → Notepad
- Current combined state visibly preserved the applicable subsequence:
  Changes → Branch → Local Servers → Usage → Repository → Editor →
  Project instructions → Notepad
- Optional sections own their leading divider. The retained direct-child
  projection contained no adjacent/doubled dividers.
- Source contract locks the full authority order, including optional PR,
  Recap, Pinned, and Markers sections.
- Relay after settle: WebSocket OPEN, one connection attempt, zero pending
  requests, no transport or RPC error
- Page errors: none
- Console: known upstream Lynx-for-Web initialization deprecation warning only
- Native/Desktop staged bundle:
  `04a1e710efa6b69f8e6d6b0f41a9d8a56355ca2b7718e774ec9baf149a6f9763`
