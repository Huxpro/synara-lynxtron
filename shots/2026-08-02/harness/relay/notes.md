# Lynx-for-Web relay acceptance

- Scope: productized main-thread WebSocket RPC relay only. This frame is a
  harness preflight artifact, not a Web↔Lynx UI-fidelity certification cell.
- Client: Lynx for Web at `http://127.0.0.1:63211/`, named browser session
  `synara-harness-lynx`.
- Server: isolated Synara at `ws://127.0.0.1:62190`, PID `47968`, state
  `/private/tmp/synara-lynx-web-harness.SUyxxH/synara-home/dev/state.sqlite`.
- Snapshot SHA-256:
  `01e429486e927df1e96accaf95444110f5e491d39a4c5afbd4757c4170e73e41`.
- Web bundle SHA-256:
  `da81f907a99bfd6cdb2f26e8cacc1475f56624c9c9cce0e828e1a4afefc4a0a5`.
- Geometry: `innerWidth=1280`, `innerHeight=820`, visual viewport `1280×820`,
  DPR `1`; PNG `1280×820`.
- Data proof: the real `Lynx Web Spike` project and its three persisted threads
  render from the isolated snapshot. No offline banner is present.
- Console: no page/runtime errors. One upstream Lynx-for-Web warning remains:
  `using deprecated parameters for the initialization function`.
- Focused tests: 2 files / 9 tests passed.
- Builds: Web `2460.2 kB` bundle and desktop `2364.3 kB` Lynx bundle passed.
  Desktop relay define remains disabled.
- Screenshot SHA-256:
  `5dae5e62d254fdd64ebaf6462b9085560a7fde710afcb727b9d0d36297bb9bae`.
