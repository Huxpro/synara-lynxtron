# Diff Dock layout evidence

- Server: `ws://127.0.0.1:58155`
- Server instance: `0a735352-e0f2-401b-ad08-28939d9f0a67`
- Web origin: `http://localhost:8998`
- Client: Lynx-for-Web production bundle
- Fixture cleanup snapshot: 77; active fixture projections: 0
- Authority: Web RightDock pins every open to an exact 50/50 split
- 1280×820 viewport:
  - App main/thread shell: x=256, width=1024
  - Chat content reservation: 512
  - Diff dock: x=768, width=512
  - Header identity shrank from 956 to 444 instead of rendering under the dock
- 900×650 viewport:
  - App main/thread shell: x=256, width=644
  - Chat content reservation: 322
  - Diff dock: x=578, width=322
  - Dock scroller: 321×560 with `scrollHeight=4478`
- No overlay or horizontal overlap was observed at either size
- Relay after settle: WebSocket OPEN, one connection attempt, zero pending
  requests, no transport or RPC error
- Page errors: none
- Console: known upstream Lynx-for-Web initialization deprecation warning only
- Native/Desktop staged bundle:
  `c92104b059df7baba030774259b263ef99da44501e59485e334eaf436b1cfe67`
