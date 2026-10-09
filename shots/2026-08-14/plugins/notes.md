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
  `another-project (DEV)` error boundary with
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
  contribution `0.25 -> 0.00`.
- `lynx-web-pointer-to-bindtap`: historical ReactLynx/Web Core dynamic-event
  P1 coverage, contribution `1.00 -> 0.00` globally. Later current-head
  Plugins search input publishes through the real product path; the older
  provider-tab cell remains route-specific missing interaction coverage until
  rerun.

## Visual and interaction continuation

### Scope selection

- The standalone Lynxtron `/update` page was evaluated first. Web has no
  equivalent application-update screen; its provider-update UI is a different
  product surface. `/update` is therefore non-comparable coverage, not a
  Web/Lynx product loss.
- `/plugins` was selected because both renderers own the route, while the
  previous run had no valid paired visual matrix.
- Shared isolated state:
  `.synara-fidelity-plugins-visual/dev/state.sqlite`.
- Both renderer phases used `ws://127.0.0.1:59120`. The server was restarted
  only to switch its trusted browser origin between Web `localhost:9121` and
  Lynx-for-Web `localhost:8080`; the state directory stayed unchanged.
- Retained cells cover Plugins failure plus Skills populated/search at
  `1280x820` and `390x844`, DPR 1, light and dark.

### Product losses found and closed

- `web-plugin-discovery-error-masked-as-empty`: P1 reliability,
  contribution `1.00 -> 0.00`.
  - The provider returned a real `Codex is not installed or not executable`
    failure.
  - Web kept placeholder empty data and rendered `No installed plugins found`,
    while Lynx correctly rendered the failure.
  - Both renderers now use
    `@synara/shared/providerDiscoveryPresentation`; errors resolve before
    unsupported/empty states.
  - Web after renders
    `Codex CLI is unavailable, so plugins cannot be loaded.` plus recovery
    guidance.
- `lynx-plugin-skill-row-unbounded-description`: P1 compact performance and
  usability, contribution `1.00 -> 0.00`.
  - `maxlines={2}` was not enforced by Lynx-for-Web. Long descriptions expanded
    rows from the intended `70px` to as much as `311px`; 117 skills produced a
    `16,913px` compact content surface.
  - The row description now uses one-line overflow/ellipsis like Web.
  - Runtime after: 117/117 rows are exactly `70px`; content height is `8,616px`.
- `lynx-provider-search-separator-drift`: P1 interaction fidelity,
  contribution `1.00 -> 0.00`.
  - Web normalized `-`, `_`, `/`, and `:` to spaces; Lynx only lowercased.
    Typing `react doctor` returned zero Lynx rows for `react-doctor`.
  - Normalization now lives in the shared presentation module.
  - A real rendered Lynx textbox input `react doctor` returns exactly the
    `react-doctor` row.

### Comparable runtime evidence

- Plugins wide/light:
  - Web and Lynx both use a `256px` sidebar and `1024x820` main surface.
  - Web heading: `x=280`, `y=81`, `976x42`.
  - Lynx heading: `x=362`, `y=86`, `812x36`.
  - The composition remains intentionally renderer-specific; semantic failure
    parity, not pixel identity, is the gate for this cell.
- Skills populated:
  - Both renderers discovered 117 real skills from the same isolated server
    environment.
  - Web compact heading wraps to `342x84`; Lynx compact heading remains
    `358x36`. This is a visible typography/layout residual, but not a P0/P1
    reliability or interaction loss.
- Web Skills tab was exercised through the rendered button.
- Lynx Web Core did not expose the tab in the accessibility tree or allow a
  selector click through its shadow boundary. A rendered custom-element
  `.click()` was used only to prepare the visual state. This older cell is not
  claimed as an interaction pass. The later global dynamic-event closure does
  not retroactively convert this provider-tab sample into trusted click
  evidence.

### Harness losses and noise

- Navigating Web first through `127.0.0.1:9121` while the server trusted
  `localhost:9121` produced an empty rejected frame. It was discarded.
- A fresh `agent-browser` session reset the viewport height to `633px` after
  navigation. That PNG was discarded; retained frames verify runtime and PNG
  dimensions after setting the viewport.
- One Web snapshot ran before React hydration completed and returned no
  interactive elements. The mounted DOM appeared immediately afterward with
  no page error; the frame was discarded as capture timing loss.
- The long-lived Web console initially included reconnect warnings from the
  discarded wrong-origin page. A fresh session had only Vite/React development
  messages.
- Lynx console contains only the known upstream deprecated initialization
  warning.

### Verification

- `packages/shared`: `bun run test -- src/providerDiscoveryPresentation.test.ts`
  - 1 file, 4 tests passed.
- `apps/web`:
  `bun run test -- src/lib/providerDiscovery.test.ts src/components/PluginLibrary.test.ts`
  - 2 files, 3 tests passed.
- `apps/lynx`: `bun run test -- src/app/PluginLibraryPage.lynx.test.ts`
  - 1 file, 2 tests passed.
- `CI=1 bun run build` in `apps/web`: passed, 8,953 modules transformed.
- `CI=1 bun run build` in `apps/lynx`: passed and staged the desktop bundle.
  Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings only.
- Native remains unverified. User-owned PID `77846` on port `8901` was not
  stopped or reused, so no Native pass is claimed.
- Owned ports `59120`, `9121`, `8080`, and `5971` were released.
- Retained screenshot count under `shots/` is 20, below the 100-image limit.

### Evidence

- `shots/2026-08-14/plugins/visual-matrix/lynx-plugins-wide-light.png`
- `shots/2026-08-14/plugins/visual-matrix/web-plugins-after-wide-light.png`
- `shots/2026-08-14/plugins/visual-matrix/web-skills-wide-light.png`
- `shots/2026-08-14/plugins/visual-matrix/lynx-skills-wide-light.png`
- `shots/2026-08-14/plugins/visual-matrix/web-skills-compact-light.png`
- `shots/2026-08-14/plugins/visual-matrix/lynx-skills-compact-light-before.png`
- `shots/2026-08-14/plugins/visual-matrix/lynx-skills-compact-light-after.png`
- `shots/2026-08-14/plugins/visual-matrix/web-skills-compact-dark.png`
- `shots/2026-08-14/plugins/visual-matrix/lynx-skills-search-compact-dark-after.png`

Screenshot-budget rotation (2026-08-18): the superseded
`web-plugins-before-wide-light.png` frame was removed after
`web-plugins-after-wide-light.png` became the retained final Web plugin
evidence. The removed bytes remain available in Git history.

## Provider-switching continuation

### Product coverage closed

- Lynx was hard-coded to Codex for capabilities, queries, labels, and copy,
  while Web authority supports all configured providers.
- The page now renders the canonical provider order and display names.
- Capabilities, Plugins queries, and Skills queries are keyed by the selected
  provider, preventing stale Codex data from appearing under another label.
- Search is reset when provider changes.
- Unsupported provider/tab combinations render their real capability state
  instead of issuing fake discovery requests.

### Verified capability matrix

- Plugins are currently available for Codex and Droid.
- Skills are currently available for Codex, Cursor, Antigravity, and Pi.
- Other provider/tab combinations remain visible but disabled by their actual
  capability response; this matches the Web authority model.

### Runtime evidence

- Isolated server: `ws://127.0.0.1:59200`.
- Route: `/plugins`, `1280x820`, DPR 1, light.
- The rendered provider strip contains:
  Codex, Claude, Cursor, Antigravity, Grok, Droid, Kilo, OpenCode, and Pi.
- A rendered state setup selected Skills and Pi.
- Result:
  - title `Make Pi work your way`;
  - 117 real skill rows;
  - observed RPCs include Pi capability discovery and
    `provider.listSkills`;
  - `connectionAttempts=1`;
  - no transport or RPC error.
- The unrelated empty-snapshot pull-request poll warning did not recur in the
  final state.

### Verification

- `bun run test -- src/app/PluginLibraryPage.lynx.test.ts src/app/settingsNavigation.test.ts`
  - 2 files, 13 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx production bundle and Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings
    only.
- Native remains unverified. User-owned PID `77846` on port `8901` was not
  stopped or reused.
- Owned ports `59200`, `8080`, and `5971` were released.
- Retained screenshot count under `shots/` is 44.

### Evidence

- `shots/2026-08-14/plugins/provider-switching/pi-skills-wide-light.png`
- `shots/2026-08-14/plugins/provider-switching/pi-skills-runtime.json`

## Unsupported-capability interaction closure (2026-08-15)

- Newly unblocked real pointer coverage selected Claude Plugins and Claude
  Skills on the same mounted route.
- **P1 product state loss closed:** Claude Plugins stayed on
  `Loading plugins…` forever with zero pending relay requests because the
  disabled resource query's `isPending` value outranked the unsupported
  capability state.
- Resource-query pending now contributes only after capabilities confirm that
  the selected provider supports the selected resource.
- **P1 copy loss closed:** the unsupported sentence now renders as one Lynx
  text value, preserving the space in
  `Plugins are unavailable for Claude.` rather than `forClaude`.
- Claude Skills remains a product pass with `118` real rows.
- Loss ledger:
  - `lynx-plugin-unsupported-perpetual-loading`: `1.00 -> 0.00`;
  - `lynx-plugin-unsupported-copy-spacing`: `1.00 -> 0.00`.
- Evidence:
  - `shots/2026-08-15/plugins-unsupported-capability/notes.md`
  - `shots/2026-08-15/plugins-unsupported-capability/plugins.json`
  - `shots/2026-08-15/plugins-unsupported-capability/skills.json`
  - `shots/2026-08-15/plugins-unsupported-capability/claude-plugins-unsupported.png`
  - `shots/2026-08-15/plugins-unsupported-capability/claude-skills-content.png`
- Codex plugin content remains an environment/missing-coverage boundary in the
  isolated server because `codex` is not on `PATH`; it is not counted as a
  Lynx product failure.
