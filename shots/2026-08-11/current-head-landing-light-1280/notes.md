# Current-head landing light 1280

- Scope: fast Lynx-for-Web loop only; Web authority and Lynx-for-Web use the
  same isolated server, snapshot, route, light theme, `1280x820` viewport, and
  DPR 1. This is not Native certification and does not close global P10.
- Server: `ws://127.0.0.1:58090`; Web origin:
  `http://localhost:8891`; state:
  `.synara-fidelity-0811/dev/state.sqlite`.
- Connection preflight: all three protocol probes resolved
  `serverInstanceId=2a060820-bbb7-4893-a4b2-d5fd9e18bece` and
  `snapshotSequence=2`.
- Retained frames:
  - Web authority: `web/landing.png`
  - Lynx-for-Web after the fix: `lynx/landing-after.png`
    Both PNGs are exactly `1280x820`.
- Baseline product failure: `lynx/landing.png` omitted the Codex provider-health
  banner even though the shared server reported Codex unavailable. The missing
  68px banner shifted the landing composition upward.
- Fix: the landing route and composer now share one
  `landing-composer-bootstrap` query. That bootstrap refreshes provider status
  and folds it into the returned server config, so banner and composer publish
  atomically instead of relying on a child-to-parent effect.
- Geometry after the fix:
  - Provider banner: Web and Lynx both `736x68` at `(400,58)`.
  - Heading y: Web `407.25`, Lynx `407`.
  - Project tray y: Web `566.5`, Lynx `565.75`.
- Runtime gate: Lynx relay is OPEN (`socketState=1`), pending requests are zero,
  and transport/RPC/page errors are empty. The sole Lynx console warning is the
  named upstream WebAssembly initialization deprecation.
- Harness failures excluded from product evidence:
  - The initial Rsbuild proxy sent host-owned `/static/css` and `/static/wasm`
    assets to Rspeedy, producing 404s. Commit `d5f5d35d0` fixes that ownership.
  - One chained browser `close && open` ended at `about:blank`; the frame was
    discarded and the named session was reopened explicitly.
- Verification: focused tests 5/5; Web and Desktop production builds pass;
  strict pull-request reuse remains `61.95%`; style coverage remains `98.07%`.
