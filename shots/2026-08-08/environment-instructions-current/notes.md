# Environment Project Instructions evidence

- Server: `ws://127.0.0.1:58155`
- Server instance: `0a735352-e0f2-401b-ad08-28939d9f0a67`
- Web origin: `http://localhost:8998`
- Client: Lynx-for-Web production bundle
- Viewport: 1280×820, DPR 1; PNG: 1280×820
- Theme: light
- Fixture: canonical project/thread create at sequences 26/27; notes copy at
  sequence 28; canonical thread/project delete at sequences 29/30; active
  fixture projections after cleanup: 0/0
- Shared storage: Zustand `synara:project-instructions:v1` through the Lynx
  storage port; component explicitly rehydrates after the app storage mirror
- Persisted value after real textarea input:
  `Prefer small focused changes. Keep RPC paths typed.`
- Autosave: real input plus 500ms debounce updated the namespaced Web harness
  backend
- Reload: full Lynx-for-Web reload restored the value and automatically
  expanded the section
- Copy: real `Copy to notepad` action wrote the exact instructions into the
  server-backed thread notes
- Dedup: the following `Append to notepad` action left snapshot sequence 28 and
  notes unchanged
- Section header: 987,310,274×24.5
- Section body: 987,334.5,274×92
- Copy action: 995,398.5,124.5×24
- Relay after settle: WebSocket OPEN, one connection attempt, zero pending
  requests, no transport or RPC error
- Page errors: none
- Console: known upstream Lynx-for-Web initialization deprecation warning only
- Native/Desktop staged bundle:
  `b7cbff329697ce661dfbac8947e43555d1b8bf02d6636c22f224c54c4df4b627`
