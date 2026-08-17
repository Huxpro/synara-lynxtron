# New-thread defaults fidelity

## Classification

- Severity: P1 behavior loss.
- Authority:
  - `defaultProvider` controls the fallback provider for new conversations and projects.
  - `defaultThreadEnvMode` controls whether a new thread uses the local checkout or a worktree.
- Previous Lynx behavior:
  - Landing fallback model selection hard-coded Codex.
  - New project defaults hard-coded Codex.
  - `thread.create` hard-coded `envMode: local`.
  - Both settings could be saved in Lynx but did not affect the canonical creation command.

## Fix

- Read the canonical General projection at Landing composer mount.
- Preserve precedence:
  1. explicit route/provider override
  2. selected project default model
  3. home project default model
  4. saved default provider
- Use the resolved provider for fallback model selection and all Landing-created project defaults.
- Fetch server settings with the Landing bootstrap and apply the server-authoritative `defaultThreadEnvMode` override through the shared projection.
- Pass the resolved environment mode into canonical `thread.create`.
- Keep existing coalescing, ambiguous-response recovery, and post-send invalidation behavior.

## Verification

- `bun run test -- src/components/composer/landingComposerFidelity.test.ts src/components/composer/landingThreadCreation.logic.test.ts src/app/settingsNavigation.test.ts`
  - 3 files passed.
  - 16 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Evidence ledger

- `product-pass`: source contracts prove provider precedence, server settings hydration, and removal of hard-coded Codex/local creation values.
- `product-pass`: thread creation tests preserve single-create and recovery semantics.
- `missing-coverage`: the isolated runtime had no executable provider, and no synthetic provider turn was sent to manufacture a thread.
- `native-unverified`: no exact-owned Native instance was launched for this slice.

## Visual and route-context continuation

### Newly discovered scope

- Comparable state: a project-scoped fresh conversation before first send.
- Web authority creates a local draft thread route through the rendered project
  action. Lynx represents the same product state as
  `/new-thread/$projectId`.
- Shared project:
  - id: `fidelity-new-thread-1786687497745`
  - title: `Synara Fidelity`
  - workspace: `/Users/bytedance/github/synara`
  - default model: `codex / gpt-5.6-sol`
- The project was created through canonical
  `orchestration.dispatchCommand(project.create)` and verified through
  `orchestration.getShellSnapshot`. SQLite was never written directly.
- Web's project-scoped draft was created through the rendered
  `Create new thread in Synara Fidelity` action after hovering the project row.

### Product loss

- `lynx-new-thread-route-presentation`: P1 route-context fidelity,
  contribution `1.00 -> 0.00`.
- Before:
  - Lynx correctly selected the project tray (`synara`) and inherited
    `GPT-5.6 Sol`.
  - The route still rendered generic `New Chat` and
    `What should we work on?`.
  - Web authority rendered `New thread` and
    `What should we do in Synara Fidelity?`.
- Root cause:
  - `initialProjectId` was passed only to `LandingComposer`.
  - The header and shared `CenteredEmptyLanding` were hard-coded as a generic
    Home conversation.
- Fix:
  - Add a deterministic route-presentation resolver.
  - Resolve the route project only from the real landing bootstrap project
    list.
  - Render `New thread` plus the project name when it exists.
  - Preserve the safe generic fallback for no project, stale IDs, and blank
    project titles.
- After:
  - Lynx wide header: `New thread`, `x=276`, `y=14`, `87.09x18`.
  - Lynx wide heading:
    `What should we do in Synara Fidelity?`,
    `x=424`, `y=407`, `688x35`.
  - `GPT-5.6 Sol` and the `synara` project selection remain intact.

### Responsive and interaction evidence

- Web:
  - wide `1280x820`, DPR 1, light;
  - compact `390x844`, DPR 1, light and dark.
  - Compact heading occupies `318x59.78` at `x=36`.
- Lynx:
  - wide `1280x820`, DPR 1, light;
  - compact `390x844`, DPR 1, dark.
  - Compact root is
    `SliceRoot--viewport-compact`.
  - Sidebar is unmounted, main content is `390x844`.
  - Heading is `294x70` at `x=48`.
  - Composer is `366x133` at `x=12`.
- A real rendered Lynx textarea input set
  `Review route context`; the visible textarea retained the value at
  `338x39`.

### Harness losses and noise

- Web `Add project` and project action buttons intentionally use
  `pointer-events: none` until their parent row is hovered. Direct click
  attempts before hover were rejected by `agent-browser`; after a real hover,
  the project new-thread action became clickable. This is expected interaction,
  not product loss.
- The initial Web snapshot ran before hydration and returned no interactive
  elements. It was discarded.
- The first Web textarea geometry probe selected an offscreen measurement
  textarea (`x=1284`) rather than the visible editor. It is retained only as a
  harness-probe mistake and is not used in product classification.
- The first Lynx compact resize occurred before the newly reloaded web host
  attached its viewport listener. The root remained
  `SliceRoot--viewport-wide`, leaving a `256px` sidebar and `134px` main
  surface. Reloading at the already-set `390px` viewport produced the correct
  compact root, closed sidebar, and full-width main surface. The rejected frame
  is classified as harness timing loss, not a responsive regression.
- Web console contains only Vite/React development messages.
- Lynx console contains only the known upstream deprecated initialization
  warning.

### Verification

- `bun run test -- src/app/landingRoutePresentation.logic.test.ts src/components/composer/landingComposerFidelity.test.ts`
  - 2 files, 5 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx production bundle and Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings
    only.
- Native remains unverified. User-owned PID `77846` on port `8901` was not
  stopped or reused.
- Owned ports `59140`, `9141`, `8080`, and `5971` were released.
- Retained screenshot count under `shots/` is 27, below the 100-image limit.

### Evidence

- `shots/2026-08-14/new-thread-defaults/visual-matrix/web-wide-light.png`
- `shots/2026-08-14/new-thread-defaults/visual-matrix/web-compact-light.png`
- `shots/2026-08-14/new-thread-defaults/visual-matrix/web-compact-dark.png`
- `shots/2026-08-14/new-thread-defaults/visual-matrix/lynx-wide-light-after.png`
- `shots/2026-08-14/new-thread-defaults/visual-matrix/lynx-compact-dark-after.png`
- `shots/2026-08-14/new-thread-defaults/visual-matrix/lynx-compact-dark-input-after.png`

Screenshot-budget rotation (2026-08-18): the superseded
`lynx-wide-light-before.png` frame was removed after
`lynx-wide-light-after.png` became the retained final wide evidence. The
removed bytes remain available in Git history.
