# Settings shell current-head evidence

- Electron authority used the still-running real Synara service and renderer at
  Vite `10054`, CDP `19321`, route `#/settings`, and DPR 2. Settings was entered
  through the rendered sidebar `Settings` button, not by changing SQLite or
  injecting fixture state.
- Electron open geometry is: 256px shell sidebar, Toggle x90/y11/24x24, Back
  x116/y9/28x28, Forward x146/y9/28x28, `Back to app` x6/y52/244x28, and
  Search input content x11/y95.5/234x21. The Back row has no aria-label, so an
  earlier aria-only probe incorrectly reported it absent; the button-text probe
  corrected that observation.
- Electron closed geometry keeps the same global controls at x90/116/146,
  removes the sidebar, and recenters the 672px content container from x651 to
  x523 at the 1728px viewport. The sidebar was restored open after capture.
- Native used isolated service PID `66023` at `ws://127.0.0.1:58090`, background
  launch root PID `85750`, Lynxtron PID `85752`, PID-derived client
  `localhost:8903/session 1`, and exact staged bundle
  `apps/lynx/dist/desktop/main.lynx.bundle`.
- Native open geometry directly measures the 46px Settings titlebar, controls
  x90..174/y9..37, Back row border x6..249/y52..80, and 672px content border
  x432..1104. Supported Native touch on the real Toggle removed the Settings
  sidebar and produced the closed controls x90..174/y0..46 while recentering
  content to x304..976. A second touch restored the sidebar open.
- Both retained Native frames are 2560x1640. Error/warning console output is
  empty in open, closed, and restored states. `native-layout.json` contains the
  PID, client, session, bundle hash, service identity, and box quads.
- Focused Lynx tests pass 8/8, the shared Web composition tests pass 2/2, and
  `apps/lynx bun run build` passes. The full heavyweight fmt/lint/typecheck pass
  remains intentionally unrun because current instructions do not authorize it.
