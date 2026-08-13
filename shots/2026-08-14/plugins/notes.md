# Lynx Plugins and Skills library

## Newly discovered scope

- Web authority route: `/plugins`.
- Lynx before: route fell through to the home screen; no plugin or skill
  library existed.
- Lynx after: `/plugins` renders a Codex discovery surface with Plugins and
  Skills tabs, search, real capability gating, installed-plugin filtering,
  loading, empty, unsupported, and RPC error states.

## Data contract

- Provider: Codex for the initial parity slice.
- Capabilities: `provider.getComposerCapabilities`.
- Plugins: `provider.listPlugins`.
- Skills: `provider.listSkills`.
- Workspace fallback: `server.getConfig().cwd`.
- No plugin or skill fixtures are hardcoded.

## Runtime evidence

- Lynx-for-Web route:
  `http://localhost:9301/lynx/index.html?route=%2Fplugins`.
- Isolated server: `ws://127.0.0.1:59040`.
- Relay diagnostics recorded:
  - `provider.getComposerCapabilities`
  - `server.getConfig`
  - `provider.listPlugins`
- The isolated environment returned a real provider discovery error, and the
  page rendered its error state rather than fabricated plugin rows.
- The Skills request is now lazy and does not run while the Plugins tab is
  active.

## Harness classification

- The existing Web process on `http://localhost:5733/plugins` rendered a
  `T3 CODE (DEV)` error boundary with
  `Primary environment request failed during fetch-session-state (HTTP 500)`.
- That process was not connected to the isolated Synara snapshot and is a
  harness mismatch, not a comparable Web authority frame. It is excluded from
  product visual-loss scoring.
- Native exact-client certification remains blocked by the user-owned
  Lynxtron client on the fixed DevTool port `8901`; no Native pass is claimed.

## Loss ledger

- `lynx-plugin-library-missing`: P1 product parity,
  contribution `1.00 -> 0.00`.
- `plugins-web-authority-isolated-snapshot`: harness gap,
  contribution `0.00` product loss.
- `plugins-cross-provider-switching`: P2 product coverage,
  contribution remains `0.25`; initial slice is intentionally Codex-first.
- `lynx-web-pointer-to-bindtap`: upstream Web Core P1 blocker,
  contribution remains `1.00`.
