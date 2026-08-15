# Plugins unsupported capability state

## Scope and identity

- Newly verified interaction: real provider and resource-tab switching on the
  Plugins route after dynamic event delivery was restored.
- Snapshot: `.synara-fidelity-plugin-providers`.
- Route: `/plugins`.
- Renderer: fresh production Lynx-for-Web bundle.
- Viewport/theme: `1280x820`, DPR 1, dark.
- Relay: `ws://127.0.0.1:58090`.

## Classification

- **P1 product state loss, closed.**
- Claude does not support plugin discovery in this environment. The resource
  query was correctly disabled, but TanStack Query reports a disabled query as
  pending before it has data. The page treated that value as an active request
  and displayed `Loading plugins…` forever even with zero relay requests.
- Pending now includes the resource query only after capabilities confirm the
  selected resource is supported.
- The newly exposed unsupported copy originally split its sentence across Lynx
  text children and rendered `forClaude`; one template string now preserves
  the exact space.
- `lynx-plugin-unsupported-perpetual-loading`: contribution `1.00 -> 0.00`.
- `lynx-plugin-unsupported-copy-spacing`: contribution `1.00 -> 0.00`.

## Evidence

- Trusted click selected Claude Plugins and rendered exactly:
  `Plugins are unavailable for Claude.`
- Trusted click selected Claude Skills and rendered `118` real rows.
- `plugins.json` and `skills.json` record active tabs, geometry, relay identity,
  and zero transport errors.
- Both PNGs are exactly `1280x820`.
- `errors.txt` is empty.

## Environment boundary

- Codex plugin discovery remains unavailable because this isolated server does
  not have `codex` on `PATH`. That is an environment/missing-coverage boundary,
  not counted as a Lynx product failure.
