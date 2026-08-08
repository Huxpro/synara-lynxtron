# Environment Recap evidence

- Server: `ws://127.0.0.1:58155`
- Server instance: `0a735352-e0f2-401b-ad08-28939d9f0a67`
- Web origin: `http://localhost:8998`
- Client: Lynx-for-Web production bundle
- Viewport: 1280×820, DPR 1; PNG: 1280×820
- Theme: light
- Fixture: canonical project/thread create at sequences 18/19; canonical
  thread/project delete at sequences 20/21; active fixture projections after
  cleanup: 0/0
- Recap cache: shared `synara:thread-recaps:v1` schema through the Lynx storage
  port (`synara.lynx.` is the Web harness backend namespace, not a product key)
- Environment overlay: 968,46,312×774
- Environment surface: 980,58,288×750
- Recap section: 987,299,274×102
- Recap content: 995,336.5,258×58.5
- Recap typography: shared composer token, 12px/19.5px, muted body at opacity
  0.4
- Persistence: retained recap survived a full Lynx-for-Web reload
- Empty-state guard: after deleting the cache and keeping the empty thread panel
  open for 13 seconds, zero `EnvironmentRecap*` nodes rendered and the cache
  stayed absent
- Refresh trigger: only real message count/id/text/streaming state plus latest
  turn state participates; tool/work row churn is ignored by focused tests
- Relay at retained capture: WebSocket OPEN, one connection attempt, zero
  pending requests, no transport or RPC error
- Page errors: none
- Console: known upstream Lynx-for-Web initialization deprecation warning only
- Generation boundary: this environment has no working Codex CLI, so no model
  generation success is claimed. The typed `server.generateThreadRecap` path,
  shared source derivation/cache schema, duplicate/live-output gates, and
  failure-preserves-existing-cache behavior are covered by source and focused
  shared tests.
- Native/Desktop staged bundle:
  `a95e7d44c1c41d0128cc2aed27c132da1e18ed8505425ef78eecce6b090b814f`
