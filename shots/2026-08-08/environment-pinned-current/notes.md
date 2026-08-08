# Environment Pinned evidence

- Server: `ws://127.0.0.1:58155`
- Server instance: `0a735352-e0f2-401b-ad08-28939d9f0a67`
- Web origin: `http://localhost:8998`
- Client: Lynx-for-Web production bundle
- Viewport: 1280×820, DPR 1; PNG: 1280×820
- Theme: light
- Fixture: canonical project create sequence 31, source thread create sequence
  32, target `thread.handoff.create` through sequence 35, first pin sequence
  36, second pin sequence 37; target/source/project delete sequences 42/43/44;
  active fixture projections after cleanup: 0/0
- Messages: real handoff-imported user and assistant messages
- Label: auto-derived from the real assistant message, then renamed through the
  product action to `Verified pinned context`
- Done: real checkbox action persisted and echoed `aria-checked=true` with the
  done presentation
- Unpin: real action removed the user-message pin; one assistant pin remained
- Checklist header: 987,413,274×24.5
- Checklist row: 987,437.5,274×32
- Checkbox: 14×14; rename/unpin actions: 24×24
- Jump boundary: the product label invokes the Transcript controller, which
  resolves only real message rows and calls native-list `scrollToPosition`.
  This two-message transcript had no scrollable range (`scrollHeight` equaled
  `clientHeight`), so no visible offset-change pass is claimed.
- Relay after a successful refresh: WebSocket OPEN, one connection attempt,
  zero pending requests, no transport or RPC error
- Page errors: none
- Console: known upstream Lynx-for-Web initialization deprecation warning only
- Native/Desktop staged bundle:
  `9c045bba7326ed74e0667cf8243afc6e94b73e77e7e59900df2b184b1030b6b3`
