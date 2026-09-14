# Fidelity continuation backlog — 2026-09-13

Electron remains the visual and behavioral authority. This backlog starts from
current HEAD `c2c8d6374`; historical partial rows are not reopened unless a
current source or runtime check proves a live gap.

## Anti-pattern verdict

Synara still reads as a deliberate native developer tool rather than generic
AI UI. The active risk is renderer drift: a newer shared Electron composition
can coexist with an older Native form or route because the relevant product
state is absent from the paired component matrix.

## Current audit signals

- Component identity: 50 stories, 100 renderer mappings, 3,232 meaningful
  matrix cells, zero missing renderer identities.
- Primitive inventory: 37 Web primitives, 22 Native primitives, zero missing
  Native counterparts and zero counterparts omitted from the Lab.
- Style/reuse checks: fail only because the existing user-owned generated
  manifests are stale. They are evidence-tool debt, not permission to rewrite
  those files in this task.
- The generic Components Lab fallback is unreachable for every currently
  declared story, but Automations has no declared paired story at all.

## New prioritized backlog

### AF-001 — Edit automation dialog drift

- Severity: P0 / High
- Category: design system, component fidelity, interaction
- Evidence: Electron uses `AutomationDialog` for both New and Edit. Native New
  now matches that composer-style dialog, while `AutomationEditDialog.lynx.tsx`
  still renders the obsolete labeled form, bordered fields, choice-chip grids,
  and the old 560px shell.
- Impact: the same automation changes visual system, information hierarchy, and
  control model when moving from Create to Edit; schedule capability also looks
  narrower than the authority.
- Owner: Native automation dialog composition.
- Closure: share the composer dialog anatomy between Native create/edit, retain
  canonical update payload semantics, verify controlled values and Save gating,
  then compare light/dark exact-owned Native against Electron.

### AF-002 — Populated/detail automation coverage gap

- Severity: P1 / High
- Category: whole-page fidelity, regression coverage
- Evidence: current-head verification covers the empty list and create dialog.
  `AutomationDetailPage.lynx.tsx`, populated list rows, Previous runs, and edit
  entry have no paired Components Lab story and no current-head Electron/Native
  geometry record.
- Impact: detail typography, split-pane proportions, metadata rows, actions, and
  run history can drift without any identity or visual gate.
- Owner: shared component catalog plus Automation list/detail routes.
- Closure: create a canonical isolated automation through product APIs, add the
  smallest real paired compositions needed for repeatable coverage, and certify
  populated/detail states before changing page geometry.

### AF-003 — Settings sidebar transition regression

- Severity: P1 / High
- Category: shell composition, reliability
- Evidence: a user-observed state placed Settings in the far-left ordinary
  sidebar. Static tests prove `SidebarDisclosure` ownership for both shells but
  do not exercise repeated ordinary route → Settings → ordinary route changes
  on the same mounted Native root.
- Impact: a stale sidebar subtree can create duplicated or misplaced Settings
  navigation and invalidate every page-level comparison after the transition.
- Owner: Native router/sidebar reconciliation.
- Closure: reproduce with exact-owned repeated route transitions, assert one
  sidebar subtree and the correct sidebar identity at each step, fix only if the
  current runtime reproduces, and retain a transition regression test either
  way.

## Execution order

1. Close AF-001 because it is a proven current implementation mismatch.
2. Use the aligned editor to create the stable AF-002 populated/detail fixture
   and close page-level residuals.
3. Exercise AF-003 across the same exact-owned process before the final route
   matrix, so stale shell state cannot contaminate evidence.

## Positive findings

- The semantic icon six-role contract remains intact after the Automations
  create-dialog work.
- All declared Components Lab stories mount real renderer implementations; the
  fallback copy is defensive and currently unreachable.
- Native static warning rows no longer inherit button or pointer semantics.
- Existing user-owned baseline/report changes remain isolated from this work.

## Completion update

### AF-004 — COMPLETE

- The previously route-only automation composer now has a paired Components Lab
  story backed by the production Electron `AutomationDialog` and Native
  `AutomationCreateDialog` / `AutomationEditDialog`, not a display-only replica.
- Create and Edit variants share one typed fixture and expose deterministic
  default/saving states in light/dark at both desktop viewports. Coverage is now
  48 stories, 96 renderer mappings, and 3,192 meaningful matrix cells.
- Exact-owned Native rendered both variants from the staged production bundle;
  the Edit story preserved the populated title/prompt, Worktree, Synara project,
  GPT-5 Codex, Daily at 9:00, one warning, and Save action with an empty console.
- Native now exposes one production `AutomationDialog` variant wrapper consumed
  by Create, Edit, and Components Lab. The identity audit therefore verifies the
  real shared boundary directly instead of relying on a compound manifest name.

### AF-005 — COMPLETE

- The populated automation detail now has a paired Components Lab story with
  active and paused variants. Native mounts the production
  `AutomationDetailPage`; Electron's route and Lab story share the extracted
  production `AutomationDetailComposition` for the page shell and Status group.
- Page-level previews use an explicit 880×520 canvas, so the split pane, complete
  Details group, and Previous runs area remain visible instead of being clipped
  by the component-sized target. Exact-owned Native confirmed the active and
  paused status/action changes and 11 detail labels with an empty console.

### AF-006 — COMPLETE

- The populated automation list now has a paired Components Lab story backed by
  extracted production list compositions in Electron and Native. The real routes
  consume those same compositions; orphan triage rows retain their thread fallback.
- Current, mixed current/paused, and loading cases use the shared typed automation
  fixtures. Exact-owned Native confirmed one active row and one muted paused row,
  two section titles, and matching title/detail/meta columns with an empty console.
- React Doctor caught and drove removal of the inherited nested-interactive Web
  row pattern: the primary row action and hover Delete action are now sibling
  buttons, preserving independent keyboard and screen-reader semantics.

### AF-007 — COMPLETE

- Native Terminal Search no longer uses font glyphs for Previous, Next, and
  Close. It now reuses the 14px ChevronDown/X icon primitives and the semantic
  secondary icon role used by Electron; Previous is the same chevron rotated
  180 degrees. `Aa` remains text because it is the intentional match-case label.
- The existing paired `terminal/search` story verified the final visible order
  `Aa / up / down / close`; PID-derived Native DOM reported three icon nodes and
  one text node, with an empty error/warning console.

### DS-008 — COMPLETE

- Native Chat history and Diff file-jump overlays no longer use a font `×` as
  their close affordance. Both now reuse the 14px `XIcon` with the semantic
  secondary icon role, matching Electron and removing font/baseline drift.
- Exact-owned Chat history showed the real XIcon while preserving the current
  row's check status as content. Diff and Editor focused suites pass 23/23; the
  Diff picker remains source/contract verified because the isolated snapshot had
  no canonical working diff to open. The exact-client console was empty.

### DS-009 — COMPLETE

- Native keeps explicit up/down Workspace reorder buttons as the documented
  platform substitute for Electron drag reordering, but their regressed font
  arrows were replaced with the shared 14px semantic ChevronDown icon; the up
  action uses a fixed 180-degree transform.
- Exact-owned Workspace showed both disabled boundary controls for its single
  row. PID-derived DOM exposed one normal and one rotated icon with preserved
  `Move Workspace 1 up/down` labels; the error/warning console was empty.

### DS-010 — COMPLETE

- The Native non-persisted image warning no longer hardcodes Electron's light
  amber. It consumes the existing theme-aware warning color, resolving to
  `#d97706` in light and `#f5b44a` in dark while preserving the 12px warning
  icon and accessible label.
- The attachment interaction suite passes 4/4 after also updating its stale
  expectation for the already-normalized ghost remove icon token. Production
  build and changed-lines Doctor pass.

### DS-011 — COMPLETE

- Native PDF Previous, Next, Zoom out, Zoom in, and Open controls no longer use
  the font glyphs `‹`, `›`, `−`, `+`, and `↗`. They now reuse the generated
  16px chevron/minus/plus and 14px external-link icons with the semantic
  secondary icon role, matching Electron's toolbar contract and removing
  font-dependent shape and baseline drift.
- Focused PDF and icon suites pass 11/11. Exact-owned Lynxtron 0.0.22 PID
  `76827` on PID-derived `localhost:8901`, session 1, exposed the five expected
  SVG identities and no error/warning console output. The final staged bundle
  SHA-256 is
  `3bacd0fbfa26ac5ba4ae22413f3f11ac678b5a7f782d74056e7208d7fcc8a396`.

### DS-012 — COMPLETE

- Native file-preview header icons no longer rely on CSS `color` inheritance
  after the generated SVG component has already resolved `currentColor`. The
  breadcrumb chevrons now receive semantic secondary paint explicitly; Source
  and Preview switch between foreground and secondary paint with selection;
  overflow/editor controls keep explicit foreground paint.
- Native Preview now uses the same Eye icon as Electron instead of the unrelated
  Code/brackets icon. Exact-owned Lynxtron 0.0.22 PID `12549` on PID-derived
  `localhost:8901`, session 1, exposed four secondary chevrons, foreground File,
  secondary Eye, foreground Ellipsis, and foreground ChevronDown SVGs with an
  empty error/warning console. Focused source/icon tests pass 6/6; production
  build passes. The final staged bundle SHA-256 is
  `ba4e8b597487d7eb539ec7fa1efa63984328c874476f6071de8ad4bc1be3d153`.

### AF-001 — COMPLETE

- Native Create and Edit now share the same composer primitives for title,
  prompt, semantic toolbar icons, warnings, and stop-condition input.
- Native Edit no longer falls back to the old labeled 560px form. It uses the
  same 768px composer shell, 240px prompt region, compact footer, warning
  acknowledgement, templates, model control, and Save gating as Electron.
- Create and Edit both consume the shared automation form/schedule contract.
  Manual, Once, Hourly, Daily, Weekdays, Weekly, Custom, and Cron are available;
  their secondary time/day/interval/timezone controls are no longer silently
  omitted. Footer menus open upward so the full menu remains inside the window.
- The superseded Native-only edit helper and its tests were removed after all
  production consumers moved to the shared contract.

### AF-002 — COMPLETE

- A canonical `Fidelity automation proof` record was created through the
  rendered Electron product dialog and observed through the same isolated
  server in Native. No automation run was started.
- Native detail now matches the Electron action model: semantic Pause/Delete
  icon buttons, a primary Run now action, lifecycle status dot, and compact
  inline controls for Runs in, Project, all eight cadence choices, time/day,
  timezone, model, and max iterations.
- The Native model row mounts the production model picker directly. Text inputs
  own local drafts and commit on blur/Enter instead of snapping back to stale
  server values. Risk-blocked definitions expose Approval needed with Approve
  and Approve & run now paths instead of leaving Run now as a dead end.
- Physical Native interaction changed Daily to Manual and back to Daily through
  the real inline menu. The final menu exposed all eight cadence choices.
- The canonical server rejected an attempted legacy `local` checkout definition
  without `local-checkout` consent, so that impossible production state was not
  fabricated for visual evidence. The blocked-state approval surface remains
  covered by the focused source contract; no approval or run action was invoked.

### AF-003 — COMPLETE

- Settings and ordinary product shells now have distinct reconciliation keys.
  The ordinary sidebar remains explicitly absent on `/settings`.
- Repeated exact-owned Native product → Settings → product → Settings routing
  produced exactly one shell at every step. DevTool counts were
  `SettingsSidebar=1 / AppSidebar=0 / SharedAppShellFrame=1` in Settings and
  `SettingsSidebar=0 / AppSidebar=1 / SharedAppShellFrame=1` after returning.
- The previously reported Settings-in-the-far-left-sidebar state did not recur,
  and the exact-client warning/error console remained empty.

## Verification

### DS-013 — COMPLETE

- Native Recent View Switcher now uses Electron's Central icon identities for
  chat, terminal, workspace, Settings, and Plugins instead of conflating chat
  and terminal or substituting unrelated Tabler glyphs. Neutral entries resolve
  the semantic secondary role explicitly; the generic terminal keeps the
  authority's primary tone, and provider identities retain branded glyphs.
- Pinned and split metadata are no longer omitted, and the footer now renders
  four shared Kbd primitives instead of one compressed text string. A new paired
  production-component story raises coverage to 50 stories, 100 renderer
  mappings, and 3,232 cells. Exact-owned Lynxtron 0.0.22 PID `75188` on
  PID-derived `localhost:8901`, session 1, exposed 6 entry icons, 2 trailing
  state icons, 4 keycaps, and one selected row with an empty console. The final
  staged bundle SHA-256 is
  `5f2115b8721e4f616047900495e6417e4d1ae83e72ba5ab67abf8986a00a07d4`.

### DS-014 — COMPLETE

- Native Landing context-tray project, environment, branch, and environment-menu
  icons now receive explicit semantic secondary paint instead of relying on CSS
  inheritance after generated SVG colors have already been resolved.
- The Temporary icon no longer reads the nonexistent `svgColors.accentForeground`;
  it resolves to the accent role when active and secondary when inactive, matching
  Electron's text-state contract. Focused landing suites pass 8/8. Exact-owned
  Lynxtron 0.0.22 PID `92511` on PID-derived `localhost:8901`, session 1, exposed
  secondary Local and Temporary SVG paint with an empty console. The final staged
  bundle SHA-256 is
  `136e99ced87c7a05bfe9eed40511e528e7a5b361fd4de0193f52a60fc6f9aece`.

### DS-015 — COMPLETE

- Native Browser chrome now matches Electron's icon identities: Forward uses
  ArrowRight instead of ChevronRight, and Copy link uses the shared Central
  chain-link asset instead of Copy. Toolbar controls resolve foreground paint;
  action-menu and suggestion icons resolve semantic secondary paint; inactive
  tab icons remain secondary while active tabs use primary ink.
- The intentionally always-dark Local home now passes its fixed white-alpha
  hierarchy directly to Refresh/Scanning/empty Globe icons, including Electron's
  1.5px empty-state globe stroke. Focused Browser/icon suites pass 8/8. Exact-owned
  Lynxtron 0.0.22 PID `14159`, window `104403`, on PID-derived
  `localhost:8901`, session 1, opened Browser through real `Cmd+Shift+B`; DOM
  exposed arrow-left, arrow-right, refresh, camera, Central chain-link, and dots
  toolbar identities plus four secondary menu icons and a clean console. The
  final staged bundle SHA-256 is
  `f7c107c36117bbb3540f13e90d9e49c7600eb9b0c3d54d1aefbb9d7d12bafad9`.

### DS-016 — COMPLETE

- Native Composer model trigger now passes semantic secondary paint directly to
  the compact status Settings icon. The generated SVG no longer ignores the
  existing CSS role and render as foreground.
- The disclosure chevron intentionally remains foreground with its existing 0.6
  opacity, matching Electron rather than applying a blanket secondary rewrite.
  Focused model/Lab suites pass 3/3. Exact-owned Lynxtron 0.0.22 PID `36471`,
  window `104448`, on PID-derived `localhost:8901`, session 1, exposed the gear
  at `rgba(13, 13, 13, 0.598)` and the chevron at `#0d0d0d`, with an empty
  console. The final staged bundle SHA-256 is
  `1e9086442cfaf1b726d8eb635e8ccd2c66783b9487dada5cc56b2f70b3ce9a63`.

### DS-017 — COMPLETE

- The paired Editor Rail Add Menu now gives both New chat and New terminal the
  same primary icon role as Electron. Native's Central terminal SVG no longer
  remains secondary while the adjacent generated chat SVG is primary, and the
  adapter's CSS now documents the effective role rather than an ignored one.
- Focused menu/Lab suites pass 2/2. Exact-owned Lynxtron 0.0.22 PID `57242`,
  window `104514`, on PID-derived `localhost:8901`, session 1, exposed both icon
  strokes as `#0d0d0d` with an empty console. The final staged bundle SHA-256 is
  `42a4504ffcf0404f31ac44ab901941e3c237033d90f38e0bdeec82ae2c1fae60`.

- Exact-owned Native: workspace Lynxtron `0.0.22`, PID `38396`, PID-derived
  DevTool `localhost:8901`, session 1, 1280×820 light product states.
- Focused Native: 39/39 passed.
- Focused Web automation: 33/33 passed.
- React Doctor 0.9.11 changed-lines scan: zero errors and zero warnings
  across 12 changed Native files and the shared Web form helper.
- Component identity: 100/100 mappings across 50 stories.
- Primitive inventory: zero missing Native counterparts and zero counterparts
  omitted from the Lab.
- Production build passed. Final staged bundle SHA-256:
  `0154aff177b6147cb769d7e9ccab5b54b007e3fb027e3fa3b68e7f68df3773c0`.
- `audit:style:check` and `audit:reuse:check` remain excluded from the green
  gate because their generated baselines are pre-existing user-owned changes;
  neither baseline was rewritten by this task.

### DS-018 — COMPLETE

- Native composer reference attachments no longer rely on post-render CSS color
  inheritance for generated SVGs. Summary MessageCircle glyphs, pasted-text File
  and ChevronRight glyphs, ghost remove X icons, solid remove X icons, and file
  attachment glyphs now receive Electron's semantic secondary, tertiary, inverse,
  or warning paint directly at render time. File attachments also use the same
  MIME-aware icon identity as Electron.
- Electron and Native now share `fileAttachmentTypeLabel`, so Native cards show
  compact `PDF` / `MD` labels instead of leaking `application/pdf` /
  `text/markdown`. A paired production-composition story covers summary,
  documents, and non-persisted image-warning variants; coverage is now 51
  stories, 102 renderer mappings, and 3,256 cells.
- Exact-owned Lynxtron 0.0.22 PID `15978`, window `104614`, PID-derived DevTool
  `localhost:8901`, session 1, confirmed PDF and Markdown identities at semantic
  secondary `rgba(13, 13, 13, 0.598)`, summary glyphs at the same secondary role,
  ghost X icons at tertiary `rgba(13, 13, 13, 0.398)`, solid X icons at `#ffffff`,
  and the light warning glyph at `#d97706`. The exact-client error/warning console
  was empty. Electron CDP confirmed the authority iframe rendered the matching
  `PDF` / `MD` labels and secondary/inverse icon roles; its macOS outer-window
  capture remained a harness-only blank-compositing failure, so it was not used as
  product evidence. No new screenshot was retained. The staged bundle SHA-256 is
  `89b0dafb02ee710128020f917b943ce8b48f1a325a84bb0e59e0be171a7040b3`.

### DS-019 — COMPLETE

- Native Kanban cards now pass semantic secondary paint directly to generated
  branch and attachment SVGs. This matches Electron's
  `text-muted-foreground/70` metadata contract and the existing Native CSS role
  instead of rendering both icons as primary foreground. Fork, pull-request, and
  status icons keep their dedicated semantic colors.
- Focused metadata tests pass 6/6. Exact-owned Lynxtron 0.0.22 PID `54033`,
  window `104803`, PID-derived DevTool `localhost:8901`, session 1, rendered the
  paired `kanban/card` draft fixture with both GitBranch and Paperclip strokes at
  `rgba(13, 13, 13, 0.598)` and an empty error/warning console. No screenshot was
  retained. The staged bundle SHA-256 is
  `8a7f6976fd2dce0989983c62161fdf4cf9d66c4547fcd50789b6b9965adb0034`.

### DS-020 — COMPLETE

- Native Kanban action glyphs now resolve their default paint at SVG generation
  time instead of relying on ignored CSS inheritance. Overview and column New
  task plus icons, project-route Back, and the header New task icon use semantic
  secondary; the hover-only project disclosure chevron uses tertiary, matching
  Electron's quieter `text-muted-foreground/50` hierarchy. Status, provider,
  fork, and pull-request content symbols remain unchanged.
- Focused column/overview/route suites pass 5/5. Exact-owned Lynxtron 0.0.22 PID
  `86971`, window `104862`, PID-derived DevTool `localhost:8901`, session 1,
  verified the live `/kanban` and project board routes: Overview New task, route
  Back/New task, and Column New card strokes resolve to
  `rgba(13, 13, 13, 0.598)` while overview chevrons resolve to
  `rgba(13, 13, 13, 0.398)`. The exact-client console was empty and no screenshot
  was retained. The staged bundle SHA-256 is
  `291d5f4406b7b2ddbed80a3f393c8aeaec1c4f3d3ae089051d568fd3e1c79e2e`.

### DS-021 — COMPLETE

- Native Thread Error Banner now passes the theme destructive color directly to
  its generated dismiss X. The icon no longer stays black under a CSS
  `color: var(--destructive)` parent; its existing dismiss opacity continues to
  match Electron's destructive/60 treatment. Provider-health dismiss remains
  foreground/65 by design and was not changed.
- A paired production `notifications/thread-error` story raises Components Lab
  coverage to 52 stories, 104 renderer mappings, and 3,264 cells. Focused shared,
  Web, and Native suites pass 9/9, 35/35, and 3/3; identity audit passes all 104
  mappings and primitive inventory remains zero missing.
- Exact-owned Lynxtron 0.0.22 PID `10025`, window `104907`, PID-derived DevTool
  `localhost:8901`, session 1, exposed both the alert and dismiss X at the light
  destructive token `#e02e2a`, with an empty error/warning console. Electron CDP
  resolved its alert at `rgb(224, 46, 42)` and dismiss X at the same destructive
  color with 0.6 alpha. No screenshot was retained. The staged bundle SHA-256 is
  `a785e229e4fcbbdd102327530ef358a6f08abad677d94a6ca02daa45359a56c7`.

### DS-022 — COMPLETE

- Native Collapsed Work and Pull Request file disclosure chevrons now embed the
  semantic secondary stroke instead of retaining primary foreground under muted
  CSS. The Collapsed Work opacity is calibrated to `0.55`; combined with the
  secondary stroke it matches Electron's computed `text-muted-foreground/55`
  alpha instead of becoming too dark. PR summary-section and comment chevrons
  remain primary because Electron inherits foreground there.
- A paired production `transcript/collapsed-work` story raises Components Lab to
  53 stories, 106 renderer mappings, 3,280 cells, and 27 interactive stories.
  Focused Native suites pass 4/4; shared manifest passes 9/9; Web story and
  composition suites pass 38/38. Identity audit passes all 106 mappings and the
  primitive inventory remains zero missing.
- Exact-owned Lynxtron 0.0.22 PID `60213`, window `105014`, PID-derived DevTool
  `localhost:8901`, session 1, measured the Collapsed Work chevron at secondary
  `rgba(13, 13, 13, 0.596078)` with opacity `0.55`; Electron CDP measured the
  authority at effective alpha `0.327843`. A separate final production run on PID
  `80605`, window `105156`, confirmed the PR file chevron at semantic secondary
  `rgba(13, 13, 13, 0.598)`. Both exact-client consoles were empty. No screenshot
  was retained. The staged bundle SHA-256 is
  `9a40474141fcf84778b17cbd22e96486e9a84a5b75048701b92c2f7a04d03297`.

### DS-023 — COMPLETE

- Native transcript status and message-action glyphs no longer depend on CSS
  `color` after generated SVG content has been encoded. The shared Native theme
  projection now exposes concrete status-neutral and status-error colors from the
  same resolved values used by Electron CSS; error rows use status error, ordinary
  thinking/tool/info/search/edit rows use status neutral, and message footer
  Copy/Edit/Revert/Add-to-chat actions use semantic secondary. Selection toolbar
  actions intentionally remain primary, matching Electron.
- `TranscriptStatusIcon` is now a reusable Native component consumed by the real
  transcript and a paired `transcript/status-row` story. Components Lab now has
  54 stories, 108 renderer mappings, and 3,328 cells. Focused shared, Web, and
  Native suites pass 9/9, 37/37, and 8/8; identity audit passes all 108 mappings
  and primitive inventory remains zero missing.
- Exact-owned Lynxtron 0.0.22 PID `52414`, window `105230`, PID-derived DevTool
  `localhost:8901`, session 1, showed error status `#e02e2a` and search status
  `#626262`. A second exact-owned run on PID `58603`, window `105269`, confirmed
  Copy/Edit/Revert message-action strokes at semantic secondary
  `rgba(13, 13, 13, 0.598)`. Electron CDP resolved its corresponding action icon
  to `rgba(13, 13, 13, 0.596)`. Both Native consoles were empty, no screenshot was
  retained, and the staged bundle SHA-256 is
  `de58e7772f13642994d8770127c389ac916ba55511525f74d4429320876671d9`.

### DS-024 — COMPLETE

- Native Sidebar hover actions and hover-card metadata no longer rely on parent
  CSS `color` after generated SVG content has been encoded. Project-row pull
  request, terminal, new-thread, thread archive, and paired-specimen actions use
  semantic secondary paint. Hover-card metadata uses Electron's exact
  `muted-foreground` source paint; thread metadata retains the authority's extra
  `0.75` opacity.
- Project hover-card pin hierarchy is state-aware: the unpinned outline uses
  muted paint with `0.55` opacity, while the pinned filled glyph uses primary
  paint at full opacity. The hover-card composition was extracted into a focused
  Native module so direct-render tests can verify all four metadata glyphs and
  both pin states without loading the full Sidebar runtime.
- Focused Native suites pass 10/10. Exact-owned Lynxtron 0.0.22 PID `48269`,
  window `105424`, PID-derived DevTool `localhost:8901`, session 1, exposed the
  project-row Plus and Archive strokes at semantic secondary
  `rgba(13, 13, 13, 0.598)` with an empty error/warning console. Electron CDP
  resolved the corresponding secondary token to `rgba(13, 13, 13, 0.596)`.
  Computer Use and DevTool mouse-move delivery did not open the real hover card,
  so hover-card paint is certified by direct render tests rather than claimed as
  Native pointer evidence. No screenshot was retained. The staged bundle SHA-256
  is `dd1438098a373c517361b6f98f66b323b582dff0e682e5f880aad95f6c498eae`.

### DS-025 — COMPLETE

- Native Composer extras no longer leaves its generated Plus, attachment, Plan,
  and Fast SVGs at primary ink while their CSS containers declare secondary.
  All four glyphs now receive semantic secondary paint during JSX render,
  matching Electron's chrome trigger and menu hierarchy.
- The focused Native suite now asserts actual encoded SVG strokes rather than
  icon presence alone and passes 4/4. Its pre-existing popup selector assertion
  was refreshed to include the current shared model-submenu selector already
  present in production CSS.
- Exact-owned Lynxtron 0.0.22 PID `70010`, window `105456`, PID-derived DevTool
  `localhost:8901`, session 1, opened the real Composer extras menu through
  Computer Use and exposed Plus, Paperclip, Blocks, and Gauge strokes at
  `rgba(13, 13, 13, 0.598)`. Electron CDP resolved both icon-secondary and its
  chrome foreground-secondary authority to the same `.598` value. The Native
  error/warning console was empty, no screenshot was retained, and the staged
  bundle SHA-256 is
  `0f76dec08422ea406c6b5a3a0a139a6c5d3d919a5a4b10a13a4a2f248f2cdf08`.

### DS-026 — COMPLETE

- Native Composer navigation chrome now passes concrete paint into generated
  Mic, model-trigger Chevron, model-search, provider-Back, and traits-Chevron
  SVGs. These controls use semantic secondary; selection checks and provider
  identity retain their existing primary or branded roles.
- Model-group disclosure chevrons now encode the Electron authority's
  `text-muted-foreground/80` source alpha (`0.48` in light mode), then retain the
  shared `0.5` chevron opacity for an effective alpha near `0.24`. This avoids
  both the original primary stroke and an over-dark plain-muted replacement.
- Focused Native suites pass 6/6. Exact-owned Lynxtron 0.0.22 PID `30074`,
  window `105594`, PID-derived DevTool `localhost:8901`, session 1, measured the
  model trigger at secondary `.598` and group chevrons at encoded `.48`; the
  earlier search cell measured Search at `.598`. A separate voice cell on PID
  `34983`, window `105626`, measured Mic at `.598`. Both exact-client consoles
  were empty, no screenshot was retained, and the final staged bundle SHA-256 is
  `e9410550d12d777ce7c3a43167789d7d887faa0a9ea6af869799d5fb9d211bcd`.
