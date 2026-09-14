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

### DS-027 — COMPLETE

- Native landing Composer project-picker group, project-option, and footer-action
  glyphs now embed muted-foreground paint instead of retaining primary ink under
  muted CSS. Existing `0.45` and `0.70` opacity preserve the intended effective
  hierarchy; selected Check glyphs intentionally remain primary.
- The focused Native suite renders a group, selected option, and footer action,
  verifies all muted SVG source strokes plus the primary Check, and passes 2/2.
- Exact-owned Lynxtron 0.0.22 PID `58112`, window `105689`, PID-derived DevTool
  `localhost:8901`, session 1, opened the real landing Composer picker and
  exposed all visible group, option, and footer-action source strokes at
  `rgba(13, 13, 13, 0.6)`, producing effective `.27` / `.42` alpha after CSS.
  The exact-client console was empty. Electron source authority uses
  `text-muted-foreground/70` for option and footer icons; the comparison snapshot
  did not expose the project-picker trigger, so no Electron interaction result is
  claimed. No screenshot was retained. The staged bundle SHA-256 is
  `464872c249e0e97b72ce7da40892e65ad604842d1eb73a20be9ce07a779fc9ac`.

### DS-028 — COMPLETE

- Native Terminal pane toolbar and Diff dock header chrome now pass semantic
  secondary paint directly into their generated default-state action SVGs. The
  affected Terminal controls are New tab, move-to-group identity, Split right,
  Split down, and Close; Diff covers Add panel and Collapse panel. Menu content
  icons and selected/tab identity roles remain unchanged.
- Dynamic hover recoloring is not claimed: Lynx generated SVG content does not
  reliably re-encode from parent CSS state. This slice closes the Electron
  default chrome hierarchy while preserving the existing hover background/focus
  affordances. Focused Terminal and Diff suites pass 13/13.
- Exact-owned Lynxtron 0.0.22 PID `89190`, window `105747`, PID-derived DevTool
  `localhost:8901`, session 1, opened the real Terminal dock and measured New,
  Split right, Split down, and Close strokes at semantic secondary
  `rgba(13, 13, 13, 0.598)`. The exact-client error/warning console was empty.
  The comparison snapshot lacked a reachable Diff data state, so Diff evidence is
  limited to its focused production source contract rather than a claimed Native
  cell. No screenshot was retained. The staged bundle SHA-256 is
  `343c67cffa2686908fc69cfe69b954f30f6a039f44311d44dcc74f075ee229cd`.

### DS-029 — COMPLETE

- Native Sidebar Space switcher now embeds three distinct Electron-authority
  tones instead of relying on `currentColor` after SVG encoding: inactive tabs
  use muted-foreground/70 (`.42` light source alpha), the active tab uses primary,
  and New space uses muted-foreground/55 (`.33`). Activity dots retain their
  separate attention/running/completed status colors.
- Focused Native tests render the complete switcher and assert inactive `.42`,
  active primary `#0d0d0d`, and create `.33`; the suite passes 7/7 with the theme
  SVG regression tests. The full production build passes on Lynxtron 0.0.22.
- The isolated comparison snapshot contains zero stored Spaces, where both
  renderers intentionally hide the strip. No records were injected merely to
  manufacture a Native frame, so this slice is certified by direct-render tests
  and build rather than a claimed real-sidebar cell. No screenshot was retained.
  The staged bundle SHA-256 is
  `0d8f200241dc733100ad02d34eaa4c92a15240a688e91c5587437afb0697c429`.

### DS-030 — COMPLETE

- Native repository chrome no longer depends on parent CSS for two generated
  glyphs: Git dock Refresh now embeds semantic secondary, while the Pull Request
  summary Branches glyph embeds muted-foreground to match its metadata label.
  PR check rings, merge state, diff stats, and other status colors remain
  unchanged.
- Focused Native suites pass 3/3, including direct-render verification of the PR
  branch stroke. The full Lynx/Desktop production build passes on Lynxtron
  0.0.22.
- Exact-owned Lynxtron PID `13709`, window `105799`, PID-derived DevTool
  `localhost:8901`, session 1, opened the real Git dock and measured Refresh at
  `rgba(13, 13, 13, 0.598)` with an empty error/warning console. The snapshot
  had no PR summary data, so that half retains focused direct-render evidence
  rather than a claimed Native screen. No screenshot was retained. The staged
  bundle SHA-256 is
  `b2681b6717f7957b59bc979a0a1dac28c13c00ff4f67a07c4bfb00f71ad4b1da`.

### DS-031 — COMPLETE

- Native Plugin Library provider-discovery warnings now embed the resolved
  warning color in their generated Circle Alert SVG instead of retaining primary
  ink under a warning-colored CSS parent. The warning row is isolated as a small
  component so its render output can be tested without loading the page query
  graph.
- The complete focused Plugin Library suite passes 4/4, including a direct-render
  assertion for light-theme warning `#d97706`. The Lynx/Desktop production build
  passes on the pinned Lynxtron 0.0.22 runtime.
- Exact-owned `/plugins` PID `30621`, window `105852`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the real provider library with an empty
  error/warning console. Its current Codex discovery state contained zero warning
  rows, so the warning glyph is certified by direct-render evidence rather than a
  claimed live warning. No screenshot was retained. The staged bundle SHA-256 is
  `827b907881a7d58359c3226956099e281185c00b04c52ff0c04997c5228400f3`.

### DS-032 — COMPLETE

- Native Voice and task-completion toast dismiss actions now reuse one
  `NotificationDismissIcon` that embeds `foreground/65`, matching Electron's
  shared `notification-fg/65` close treatment. Provider Update retains its
  existing container-level `0.65`; Provider Health retains its independently
  verified foreground/65 rule; Sidechat close remains crisp header foreground.
- The isolated direct-render/theme suites pass 4/4 and verify the generated X
  stroke at `rgba(13, 13, 13, 0.65)`. The full Lynx/Desktop production build
  passes on Lynxtron 0.0.22. The large Task host suite remains blocked before
  test execution by its existing Rstest-generated lynx-ui vendor parse failure,
  so this slice does not claim that unrelated suite.
- Voice and task toasts are transient async surfaces and were not artificially
  triggered for a retained Native frame. No screenshot was retained. The staged
  bundle SHA-256 is
  `2b2c0102051df08899ac35a5ebaa78e4dfcb41ae65d643195a7dded940a870be`.

### DS-033 — COMPLETE

- Native shared Menu submenu chevrons now embed the Electron authority's
  foreground/80 paint during JSX render instead of retaining full foreground
  while an ineffective inherited CSS color declared muted foreground. Selection
  Check indicators intentionally remain full foreground.
- The Composer provider submenu no longer applies a second `0.8` opacity to the
  already-resolved Chevron, avoiding an unintended effective `.64` tone. Focused
  shared Menu and Composer model-picker suites pass 23/23; the Web submenu browser
  fixture passes 2/2; the full Lynx/Desktop production build passes on Lynxtron
  0.0.22.
- Electron CDP measured the real Composer submenu Chevron as foreground with
  `opacity: 0.8`. Exact-owned Lynxtron PID `8589`, window `105997`, PID-derived
  DevTool `localhost:8901`, session 1, opened the same real model submenu and
  measured encoded stroke `rgba(13, 13, 13, 0.8)` with computed opacity `1`; the
  exact-client error/warning console was empty. No screenshot was retained. The
  staged bundle SHA-256 is
  `181499d0b39033af038ccf3960bb868375952c0db4e710140f439a8f57ca9759`.

### DS-034 — COMPLETE

- Native shared Dialog close actions now embed the resolved secondary-foreground
  stroke in their generated X SVG and apply the same child `0.8` opacity as
  Electron's shared ghost icon button. The previous muted CSS declaration could
  not recolor generated SVG content, leaving every standard Native dialog close
  at full foreground.
- The focused Native Dialog suite passes 10/10. A focused Electron browser test
  renders the same Components Lab closable-dialog story and locks its close
  button to secondary foreground plus child opacity `0.8`; that suite passes 4/4.
  The full Lynx/Desktop production build passes on Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `43531`, window `106088`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the real Components Lab closable dialog
  and measured encoded stroke `rgba(13, 13, 13, 0.598)`, computed opacity `0.8`,
  and 18px square geometry. The exact-client error/warning console was empty. No
  screenshot was retained. The staged bundle SHA-256 is
  `c398c847492cbff9ac1e7a4854503be09ccda96cd7fc866aad934d6b16edaaf3`.

### DS-035 — COMPLETE

- Native terminal Scroll-to-bottom now embeds muted-foreground paint in its
  generated Arrow Down SVG and applies the shared icon-child `0.8` opacity,
  matching Electron's outlined IconButton treatment. The previous Native arrow
  remained full foreground because its CSS color could not recolor SVG content.
- The targeted terminal contract test passes; the containing test file's other
  router-wiring assertion remains independently stale because it expects a
  removed hard-coded pane array. The full Lynx/Desktop production build passes
  on Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `62611`, window `106196`, PID-derived DevTool
  `localhost:8901`, session 1, loaded the real workspace Terminal with an empty
  error/warning console. Its fresh PTY contained only the prompt and both Native
  input-focus attempts remained uncommitted, so the jump control could not be
  reached without synthetic state; no live glyph claim and no screenshot were
  retained. The staged bundle SHA-256 is
  `2a74f3c0a352ba414807bdc06726e12108b0b1d3f4f8ccf7ebbc34e58aa728d5`.

### DS-036 — COMPLETE

- Native Workspace header Terminal, Settings, and current renderer-only Delete
  actions now embed foreground/80 paint in their generated icons, matching the
  Electron outline Button's inherited foreground plus shared icon `0.8` opacity.
  The Native Delete action remains because its Sidebar does not yet expose
  Electron's hover-only workspace deletion control; this paint slice does not
  remove the only available capability.
- The focused Workspace suite passes 6/6 and locks all three header glyphs to the
  resolved foreground/80 value. The full Lynx/Desktop production build passes on
  the npm Lynxtron 0.0.22 runtime.
- The isolated comparison snapshot had no persisted Workspace. Its `/workspace`
  route redirected Electron to a newly created thread during preflight, so no
  mismatched route was used as visual evidence and no screenshot was retained.
  The staged bundle SHA-256 is
  `9267a0238d8ac7a158b5e4e4d9d10e877ab8e3d7269618d8e3fff7a9aef5066c`.

### DS-037 — COMPLETE

- Native Settings outline actions now embed Electron's foreground/80 icon paint
  instead of full foreground. The shared family covers both Provider Update
  placements, Provider Usage Refresh, and Custom Models Add; select chevrons,
  reset glyphs, and warning icons keep their separate contracts.
- Provider Tools and Settings label suites pass 10/10. The Custom Models suite
  remains blocked before test execution by the existing Rstest-generated
  `lynx-ui-button` vendor parse error, while its focused source assertion and the
  full Lynx/Desktop production build pass on Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `19464`, window `106356`, PID-derived DevTool
  `localhost:8901`, session 1, opened the real Usage page and measured Refresh at
  encoded stroke `rgba(13, 13, 13, 0.8)` with an empty error/warning console. The
  current Providers snapshot had no update action, so no update was fabricated or
  invoked. No screenshot was retained. The staged bundle SHA-256 is
  `592468ee2bff25f58107b81fdd8068a8b3956f4ae14c3c6704c47815bf2b209f`.

### DS-038 — COMPLETE

- Native Appearance, Theme Pack code-theme, and Custom Models provider Select
  chevrons now match the established General/Git Writing and Electron Select
  contract: full foreground is encoded into the generated SVG and the element
  applies `0.5` opacity. Font-combobox, reorder, and disclosure chevrons keep
  their separate semantics.
- Appearance and Theme Pack focused suites pass 12/12. The Custom Models suite
  remains blocked before execution by the existing generated `lynx-ui-button`
  vendor parse error; its source/style contract and the complete Lynx/Desktop
  production build pass on Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `35544`, window `106406`, PID-derived DevTool
  `localhost:8901`, session 1, opened the real Models page and measured both the
  existing Git Writing and newly normalized Custom Models chevrons at encoded
  `#0d0d0d` with computed opacity `0.5`. The exact-client error/warning console
  was empty. No screenshot was retained. The staged bundle SHA-256 is
  `62754b32144140259a176e5a7f536ceabdbae54dc273383c54bb5b11533c8658`.

### DS-039 — COMPLETE

- Every Native Settings row reset action now reuses one generated Undo glyph
  with the Electron default-state effective tone: muted foreground multiplied by
  the shared Button icon opacity, resolved to `.48` in the light theme. This
  covers General, Appearance, Git Writing, Provider Picker/Tools, Theme Pack,
  Custom Models, and other Settings owners of `SettingsResetIcon`.
- The shared Settings suite directly renders the icon and verifies encoded stroke
  `rgba(13, 13, 13, 0.48)`; all 6/6 assertions pass. The full Lynx/Desktop
  production build passes on Lynxtron 0.0.22. Dynamic hover recoloring is not
  claimed because generated SVG content does not re-encode from parent CSS state.
- Exact-owned Lynxtron PID `53122`, window `106464`, PID-derived DevTool
  `localhost:8901`, session 1, opened the real Appearance page and measured its
  visible Theme reset glyph at the same `.48` encoded stroke. The exact-client
  error/warning console was empty. No screenshot was retained. The staged bundle
  SHA-256 is
  `1daa312c0fc158f88b65ac29cfe2085fd5e74c272c7b9ca1daadfe55b87be049`.

### DS-040 — COMPLETE

- Native Pull Requests route Refresh now embeds semantic secondary paint in its
  generated SVG, matching Electron's ghost IconButton default hierarchy. Search,
  filter, warning, and PR status glyphs retain their independent roles.
- The focused PR route controls suite passes 5/5, including direct-render
  verification of `rgba(13, 13, 13, 0.598)`. The full Lynx/Desktop production
  build passes on the npm Lynxtron 0.0.22 runtime.
- Exact-owned Lynxtron PID `72173`, window `106528`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the real empty Pull Requests route and
  exposed the 16px Refresh glyph at the same `.598` encoded stroke. The
  exact-client error/warning console was empty. No screenshot was retained. The
  staged bundle SHA-256 is
  `99c2358b300158551546b79c222e448788380c132d235b42b8a2b0d7175c1834`.

### DS-041 — COMPLETE

- Native Profile action icons now match their Electron Button variants instead
  of flattening the family into one tone. Top-level Share/Edit and Edit-dialog
  Upload use foreground source with the shared `0.8` icon opacity; Remove uses
  muted source with the same opacity and a muted label.
- The focused Profile suite passes 5/5 and the full Lynx/Desktop production build
  passes on the npm Lynxtron 0.0.22 runtime. The export-card, avatar, provider,
  and status colors remain unchanged.
- Exact-owned Lynxtron PID `115`, window `106603`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the real Profile page and Edit dialog.
  Share/Edit encoded `#0d0d0d` at computed opacity `0.8`; Upload did the same at
  14px. The snapshot had no avatar, so Remove remained source/test verified. The
  exact-client console was empty. No screenshot was retained. The staged bundle
  SHA-256 is
  `7ab8a34b486c55e2c90c5b231e322a6be1c0dbec4bec74542cbfdc0790c6050a`.

### DS-042 — COMPLETE

- Native Project Action editor icons now preserve Electron's two visual roles
  instead of applying semantic secondary to the entire picker. The outline
  `Choose icon` trigger renders foreground/80 at 18px; the six picker options
  render full foreground at 16px.
- The focused Project Action editor contract passes 1/1, including the current
  Native textarea contract, and the full Lynx/Desktop production build passes
  on the npm Lynxtron 0.0.22 runtime.
- Exact-owned Lynxtron PID `37494`, window `106652`, PID-derived DevTool
  `localhost:8901`, session 1, physically opened the Add Action dialog and icon
  picker. DevTool found one trigger SVG encoded at
  `rgba(13, 13, 13, 0.8)` with an 18px style and six option SVGs encoded at
  `#0d0d0d` with 16px geometry. The exact Native error/warning console was empty.
  Electron's live reference exposed the same 18px trigger source contract and
  16px full-foreground options. No screenshot was retained. The staged bundle
  SHA-256 is
  `e65818085a6c68021d986e4b7b29e1b6dd28aa568d65d8cc8a77322cbe00a801`.

### DS-043 — COMPLETE

- Native Project Action picker geometry now matches Electron's spatial contract
  instead of presenting a denser two-column reinterpretation. The outline
  trigger is 36px, the popup is anchored 4px below it with Electron's 16px
  viewport padding, and the six 72×56px choices form a stable three-column grid
  with 8px column, row, and icon-label gaps.
- The focused Project Action editor contract passes 1/1 and the complete
  Lynx/Desktop production build passes on the npm Lynxtron 0.0.22 runtime.
- Exact-owned Lynxtron PID `71635`, window `106720`, PID-derived DevTool
  `localhost:8901`, session 1, physically opened the Add Action dialog and picker.
  Native measured the trigger at 36×36, grid content at 232px wide, three first-row
  options at x=465/545/625, and the second row 64px below the first. Lynx reports
  each option content box at 70×54 because its one-pixel border yields the intended
  72×56 border box. The exact Native error/warning console was empty. Electron's
  live reference visibly exposed the same 36px trigger and three-column grid, and
  its source defines `size-9`, `grid-cols-3`, 8px gaps, and 8px option padding. No
  screenshot was retained. The staged bundle SHA-256 is
  `729857c0c213084f0745ac8bf2d77a9d5ad64a43814c926668aaa90b05e122f6`.

### DS-044 — COMPLETE

- Native Project Action auto-run control now matches Electron's desktop row
  anatomy instead of shrinking both copy and switch. The row uses 12px horizontal
  padding, the label is 14px/20px, and the off/on control uses the same 32×20px
  track with a 16×16px thumb.
- The focused Project Action editor contract passes 1/1 and the complete
  Lynx/Desktop production build passes on the npm Lynxtron 0.0.22 runtime.
- Exact-owned Lynxtron PID `99420`, window `106823`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the open Add Action story. Native measured
  the row at 12px left/right padding, its label at 258×20 with 14px/20px type, the
  track at 32×20, and the thumb at 16×16. The exact Native error/warning console
  was empty. Electron authority uses the same desktop `text-sm`, `px-3 py-2`, and
  32×20 shared Switch contract. No screenshot was retained. The staged bundle
  SHA-256 is
  `f2a1c03629c9bc1a8c4834032025164ca50c9dff7cfcafb1984c04af0970e521`.

### DS-045 — COMPLETE

- Native Project Action form copy now matches Electron's established type tiers:
  12px/16px medium field labels, 12px/16px muted keybinding guidance, and
  14px/20px destructive validation copy. The previous Native values mixed an
  over-loose 18px label line height with undersized 11px hint and error text.
- The focused Project Action editor contract passes 1/1 and the complete
  Lynx/Desktop production build passes on the npm Lynxtron 0.0.22 runtime. The
  remaining field-group, input, textarea, and footer geometry already matches the
  Electron authority, so no further component-local geometry change is warranted.
- Exact-owned Lynxtron PID `11265`, window `106855`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the error story and measured all three
  labels at 12px/16px, the hint at 12px/16px with muted foreground, and the error
  at 14px/20px with the destructive token. The exact Native error/warning console
  was empty. No screenshot was retained. The staged bundle SHA-256 is
  `2322c400f5a2c24c1abacac4b7b88e59e3ed63b4be58597a70738d84f132aaf5`.

### DS-046 — COMPLETE

- Native Project Action dialog now reaches Electron's 512px desktop width. The
  previous `width: min(512px, calc(100vw - 32px))` declaration was not applied by
  the Native engine, so the shell silently fell back to the shared 420px Dialog
  width despite appearing correct in source. The rule is now expressed as the
  supported `width: 512px` plus `max-width: calc(100vw - 32px)` pair.
- The focused Project Action editor contract passes 1/1 and the complete
  Lynx/Desktop production build passes on the npm Lynxtron 0.0.22 runtime.
- Exact-owned Lynxtron PID `24998`, window `106887`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the open Add Action story and measured the
  dialog content box at 510px and border box at exactly 512px. The exact Native
  error/warning console was empty. No screenshot was retained. The staged bundle
  SHA-256 is
  `314229f9735563cafb51044988dc3cb26b0a8d53d384fc545241c63fd8128f38`.

### DS-047 — COMPLETE

- Shared Native `DialogDescription` now matches Electron's standard `text-sm`
  dialog tier at 14px/20px instead of rendering every unoverridden description
  at 12px with an implicit line height. This corrects the primitive for Project
  Action, rename, workspace, Space, Settings, and other standard dialog consumers
  while preserving their explicit local overrides.
- The direct shared Dialog suite passes 11/11 and the Project Action contract
  passes 1/1. The broader filename-matched Rstest run also surfaced two existing
  unrelated failures: a generated `lynx-ui` vendor parse failure and a stale
  AppSnap source-string assertion. The complete Lynx/Desktop production build
  passes on the npm Lynxtron 0.0.22 runtime.
- Exact-owned Lynxtron PID `36818`, window `106917`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the shared `ui/dialog`
  title-description/open story and measured `LxDialogDescription` at 14px/20px
  with muted foreground. The exact Native error/warning console was empty. No
  screenshot was retained. The staged bundle SHA-256 is
  `4db0f79a3ee064b28320269731f0a3805838f7c7349283fb060366c7eeed30e2`.

### DS-048 — COMPLETE

- Shared Native Dialog headers now own Electron's 6px title-to-description gap.
  The previous primitive put a 4px top margin on the description child, producing
  tighter rhythm and splitting one layout contract across parent and child. The
  title-only case remains unaffected.
- The focused shared Dialog suite passes 11/11 and the complete Lynx/Desktop
  production build passes on the npm Lynxtron 0.0.22 runtime.
- Exact-owned Lynxtron PID `49765`, window `106949`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the shared `ui/dialog`
  title-description/open story. The title box ended at y=403 and the description
  began at y=409, proving the resolved 6px gap; their measured heights were 22px
  and 20px. The exact Native error/warning console was empty. No screenshot was
  retained. The staged bundle SHA-256 is
  `327771d5a3284cf91ba78cd187b95070c3d6e0a0ded7582451387b5e15e485d1`.

### DS-049 — COMPLETE

- Shared Native Input now preserves Electron's size-specific horizontal insets:
  default uses 12px, small uses 10px, and large uses 14px. The previous Native
  primitive flattened all three sizes to 10px, making default and large fields
  read too dense across forms and settings. Textarea's dialog-specific 10px
  content inset remains independent.
- The focused Input suite passes 3/3 and the complete Lynx/Desktop production
  build passes on the npm Lynxtron 0.0.22 runtime.
- Exact-owned Lynxtron PID `72043`, window `106977`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the `ui/input` filled story and switched
  through all three size variants using visible controls. Native measured default
  at 32px min-height / 12px insets, small at 28px / 10px, and large at 36px /
  14px. The exact Native error/warning console was empty. No screenshot was
  retained. The staged bundle SHA-256 is
  `a9931468fb38a2bcd18a22b53f774746fee5db1ddcde04230e7eebbe11117a5d`.

### DS-050 — COMPLETE

- Shared Native Textarea now has a real multiline size axis instead of inheriting
  one-line Input heights while the Components Lab masked the issue with a fixed
  70px fixture. Default, small, and large now match Electron at 70/66/74px
  minimum heights, 11/9/11px horizontal insets, and 5/3/7px vertical insets.
- Project Action retains its product-specific 96px command field and explicit
  10px horizontal inset. The focused Input plus Project Action suites pass 5/5,
  and the complete Lynx/Desktop production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `87588`, window `107018`, PID-derived DevTool
  `localhost:8901`, session 1, used the visible `ui/textarea` variant controls and
  measured default 70px/11px, small 66px/9px, and large 74px/11px for
  min-height/horizontal inset. The exact Native error/warning console was empty.
  No screenshot was retained. The staged bundle SHA-256 is
  `6d2dd190272e8a70649d5d9fcefe4f8963479e938d0aa546a584e2b3ea51eb2f`.

### DS-051 — COMPLETE

- Shared Native Checkbox now uses Electron's light-border token for its unchecked
  outline instead of the heavier generic border token. Checked and mixed states
  continue to override both border and fill with primary.
- The focused Checkbox suite passes 3/3 and the complete Lynx/Desktop production
  build passes on the npm Lynxtron 0.0.22 runtime.
- Exact-owned Lynxtron PID `37624`, window `107195`, PID-derived DevTool
  `localhost:8901`, session 1, rendered unchecked and checked states. The
  unchecked matched rule parsed `border-color: var(--color-border-light)` and the
  aggregate computed border resolved to `hsla(0,0%,5%,.06)`; checked retained
  primary `#0d0d0d` for border and fill. DevTool's per-side color field serializes
  the translucent token as current color, so the matched rule and aggregate value
  are the valid evidence. The exact Native console was empty and no screenshot was
  retained. The staged bundle SHA-256 is
  `673e0c8b8e0e41838afa1a8656b2e166f3359dc3f8e668f9885e1ab27c53b25b`.

### DS-052 — COMPLETE

- Shared Native Alert now matches Electron's size-dependent typography instead
  of flattening both sizes into one 12px/18px tier. Default title and description
  use 14px/20px; compact alerts use 12px/16px. Existing padding, radius, semantic
  colors, and action layout remain unchanged.
- The focused Alert suite passes 2/2 and the complete Lynx/Desktop production
  build passes on the npm Lynxtron 0.0.22 runtime.
- Exact-owned Lynxtron PID `85904`, PID-derived DevTool `localhost:8901`, session
  1, rendered the default `ui/alert` story. Title resolved to foreground at
  14px/20px and description to muted foreground at 14px/20px. The catalog does
  not expose a compact Alert case, so 12px/16px remains direct source/test evidence
  rather than a claimed Native story cell. The exact Native console was empty and
  no screenshot was retained. The staged bundle SHA-256 is
  `42531e6a36be6952f264fe6ea773c197e93455a9c152f1aaa464b680ad670756`.

### DS-053 — COMPLETE

- Shared Native Badge now preserves Electron's error, info, success, and warning
  status tones instead of collapsing all four onto the generic secondary surface.
  Each status uses a theme-derived concrete 8% tint in light mode and 16% tint in
  dark mode, while text keeps its corresponding semantic color.
- The first CSS `color-mix()` implementation parsed in DevTool but rendered
  transparent in Native. The final implementation computes concrete rgba from the
  active Theme Pack in `useTheme()` and injects it at render time, preserving
  custom themes without relying on unsupported Native paint behavior.
- The focused Badge suite passes 2/2 and the complete Lynx/Desktop production
  build passes on npm Lynxtron 0.0.22. Exact-owned Lynxtron PID `36980`, window
  `107383`, PID-derived DevTool `localhost:8901`, session 1, rendered the success
  story with inline `#00a24014`, computed background
  `rgba(0,162,64,0.0784314)`, and text `#00a240`. Error/info/warning remain direct
  render/source tests because the catalog status case exposes success only. The
  exact Native console was empty and no screenshot was retained. The staged bundle
  SHA-256 is `5b22014f0d9d4254e99c72329c7aca68d7bd2e32cdbf9b4aa1a6e0458dd54cd5`.

### DS-054 — COMPLETE

- Native TimePicker now opens with the current hour and minute centered in their
  176px scroll columns, matching Electron instead of always exposing the first
  rows. The implementation uses the container's one-shot pixel
  `initial-scroll-offset`; it does not invoke child `scrollIntoView`, whose Native
  failure previously surfaced a LogBox error.
- The focused TimePicker suite passes 3/3 and directly locks offsets 0/200/830 for
  values 0/9/30 plus the no-`scrollIntoView` contract. The complete Lynx/Desktop
  production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `84722`, window `107467`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the `09:30` story. Both columns measured
  y=366–542 (176px), while both selected rows measured y=440–468; their centers
  are exactly y=454, equal to the column center. The exact Native error/warning
  console was empty, no screenshot was retained, and the final staged bundle
  SHA-256 is
  `acc31bc6212ba20d147d4daa8fc90e90ebb98959cfc0240bdb7380293e02d54f`.

### DS-055 — COMPLETE

- Shared Native Skeleton now matches Electron's moving highlight material instead
  of rendering a static muted block at an extra 0.45 opacity. Native uses the
  same 2s / -1s linear cadence, 64% light and 4% dark white highlight, and a
  reduced-motion static fallback.
- Lynx marks `background-position` as non-animatable, so the Native primitive uses
  an absolutely positioned gradient layer with an animatable transform rather
  than copying Electron's unsupported background-position keyframe. The focused
  loading suite passes 2/2 and the complete production build reports 6/6 tasks
  successful on npm Lynxtron 0.0.22.
- Exact-owned light PID `18413` / window `107503` and dark PID `49111` / window
  `107569`, both PID-derived DevTool `localhost:8901`, session 1, rendered the
  stacked Skeleton story. Light shimmer x advanced 509→629→754 across 250ms
  samples; dark advanced 877→416 across a loop boundary. Dark computed style
  resolved the highlight to `#ffffff0a`, animation state was running, and both
  exact Native consoles were empty. No screenshot was retained. The final staged
  bundle SHA-256 is
  `f6322581960fd00497d2e1d1dbbfaf0227138ba5f9561ae6d7cd6c1ba9fd256d`.

### DS-056 — COMPLETE

- Native Spinner keeps its documented ring-shaped platform implementation, but
  now restores the missing loading motion. The ring rotates at Electron's 1s
  linear infinite cadence and stops under reduced motion; status semantics, size
  props, and consumer color overrides remain unchanged.
- The focused loading suite passes 2/2 and directly guards both the motion and
  reduced-motion rules. The complete production build reports 6/6 tasks
  successful on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `62777`, window `107597`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the default Spinner story. Native exposed
  the intended 16px outer ring, foreground paint with a transparent right edge,
  and parsed `LxSpinnerSpin` as running, 1000ms, linear, and effectively infinite.
  The exact Native error/warning console was empty, no screenshot was retained,
  and the final staged bundle SHA-256 is
  `48dcf5623cb50a6de82f5ffac52589dc301803d8cdf657cfe486d39ed967b597`.

### DS-057 — COMPLETE

- Shared Native Collapsible panels now reuse the repository's single 220ms
  ease-out disclosure motion instead of mounting/unmounting instantly. Closed
  panels remain present through the existing 260ms transition-plus-cleanup window,
  expose `aria-hidden`, then unmount; reduced-motion still removes immediately.
- The implementation composes the existing `useLynxDisclosurePresence` and
  `disclosureContentClassName` helpers, so it adds no second animation contract.
  Focused Collapsible and motion suites pass 5/5; the complete production build
  reports 6/6 tasks successful on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `88604`, window `107625`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the open Collapsible story with
  `LynxDisclosureMotion--open`. A real trigger click closed the panel and it was
  absent after the shared cleanup window; the exact Native error/warning console
  was empty. No screenshot was retained. The final staged bundle SHA-256 is
  `299de57e70abb652f0ed2ccb959bb9f8bc0e43d7eba3c932fe0dfdf6e59171fa`.

### DS-058 — COMPLETE

- Native Alert semantic variants now preserve Electron's role-specific 4%
  surfaces and 32% borders instead of flattening error/info/success/warning onto
  the generic secondary surface. Values are computed from the active Theme Pack
  as concrete rgba, avoiding unsupported Native `color-mix()` paint.
- The focused Alert plus Badge regression suites pass 5/5 and cover all four
  light-theme variants. The complete production build reports 6/6 tasks
  successful on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `6142`, window `107662`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the success story with computed
  `rgba(0,162,64,0.0392157)` surface and `rgba(0,162,64,0.317647)` border. The
  title remained 14px/20px medium, the exact Native error/warning console was
  empty, and no screenshot was retained. The final staged bundle SHA-256 is
  `3b6ec3854aa7c2865d1a74f5c985ee226c993fd1dddbfb7142d9f76c8fdba5fd`.

### DS-059 — COMPLETE

- Shared Native Menu and Command now preserve Electron's two auxiliary-copy
  roles instead of flattening both to full-strength 10px muted text. Menu group
  labels use 12px/16px regular type, 8×6px insets, and 45% secondary opacity;
  Menu shortcuts use 10px medium type, 1px tracking, auto-leading alignment, and
  72% muted opacity.
- Focused Menu and Command suites pass 32/32. The complete production build
  reports 6/6 tasks successful on npm Lynxtron 0.0.22; the existing Project Sort
  popup's local 12px/16px medium label override remains intact.
- Exact-owned Lynxtron PID `22902`, window `107694`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the shortcut menu. Native computed the
  Actions label at 12px/16px, weight 400, 8×6px inset, opacity 0.45, and the ⌘N
  shortcut at 10px, weight 500, 1px tracking, opacity 0.72. The exact Native
  error/warning console was empty and no screenshot was retained. The final
  staged bundle SHA-256 is
  `b1cdce27247d4de6141ef9487f46ef4fef81df4e04bb587ecc73ae08af01b7bf`.

### DS-060 — COMPLETE

- Native Command shortcuts now match Electron's distinct `text-xs` role at 12px
  with 0.1em/1.2px tracking. DS-059 correctly restored the shared 72% muted,
  medium-weight trailing hierarchy, but initially reused Menu's intentionally
  smaller 10px/1px size instead of preserving Command's separate scale.
- Focused Menu and Command suites pass 32/32, and the affected Lynx/Desktop
  production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `33644`, window `107722`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the highlighted Command story. Native
  computed shortcut type at 12px, weight 500, 1.2px tracking, opacity 0.72, and
  trailing auto margin. The exact Native error/warning console was empty and no
  screenshot was retained. The final staged bundle SHA-256 is
  `25e1173c404bb309f4cc5c82209c5d417360187bf83e8d476af7a99aef4aa1be`.

### DS-061 — COMPLETE

- Shared Native Tooltip popups now reuse the centralized 220ms disclosure
  motion/presence contract rather than appearing and disappearing instantly. The
  former `ui-entering/ui-leaving` CSS selectors were dead because Tooltip never
  applied those classes; they were removed.
- Focused Tooltip, disclosure-motion, and primitive-geometry suites pass 9/9, and
  the affected Lynx/Desktop production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `46129`, window `107750`, PID-derived DevTool
  `localhost:8901`, session 1, used the rendered Copy trigger. The open popup
  exposed `LynxDisclosureMotion--open`; a second real click closed it and it was
  absent after the shared cleanup window. The exact Native error/warning console
  was empty and no screenshot was retained. The final staged bundle SHA-256 is
  `28dda140331a399efde1e68e8c0a8d43027fa90210e9a63a7a83cb0ab965d201`.

### DS-062 — COMPLETE

- Native switch-style Menu items now match Electron's desktop override at a
  24×16px track, 12×12px thumb, and 8px checked travel. The previous Native
  implementation used a 26×16px track with a 10px thumb and 10px travel.
- The real switch variant is now a paired `ui/menu` Components Lab case instead
  of remaining visible only inside Diff/Extras product menus. Coverage grows from
  3,328 to 3,368 meaningful cells. Native Menu/Lab tests pass 22/22, Web Lab
  tests pass 37/37, shared manifest tests pass 9/9, and the complete production
  build reports 6/6 tasks successful on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `64016`, window `107795`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the checked switch story. Native measured
  a 24×16px track border box and 12×12px thumb; the checked thumb's CSS left was
  9px versus 1px unchecked, proving 8px travel. The exact Native error/warning
  console was empty and no screenshot was retained. The final staged bundle
  SHA-256 is `9ee03495a1e94f598c6ed53e883c29fbc481a066ffcbc9ede8b27d5c4129cf86`.

### DS-063 — COMPLETE

- Native full-size and Menu switches now use Electron's 200ms ease-out state
  transition for track color/border/shadow and thumb movement instead of jumping
  instantly. Reduced-motion shortens all four transition surfaces to 0.01ms.
- Menu thumb state now animates with `translateX(8px)` rather than changing the
  left layout property, preserving the DS-062 geometry while matching Electron's
  transform-based path. The paired Menu switch story is now genuinely controlled
  in both renderers, so a rendered click changes state instead of exercising a
  static no-op fixture.
- Native Switch/Menu/Lab focused tests pass 25/25, Web Lab tests pass 37/37, and
  the complete production build reports 6/6 tasks successful on Lynxtron 0.0.22.
  Exact-owned PID `88132` / window `107856`, PID-derived `localhost:8901`, session
  1, changed the checked thumb from `translateX(8px)` to `translateX(0)` through
  the real row click while retaining 200ms/ease-out. The Native console was empty;
  no screenshot was retained. Staged bundle SHA-256 is
  `0a74ddd295cc528d0db4ec878da173c51656a23b2f91de3e6adcfe3c50d8f964`.

### DS-065 — COMPLETE

- Native Menu switches now reuse the same color roles as Electron and the shared
  full-size Switch: checked track/border use accent blue, while unchecked uses the
  14% switch border and platform off surface. The previous Menu-only palette used
  primary black and generic muted/border tokens.
- Focused Menu and Switch suites pass 25/25, and the affected Lynx/Desktop
  production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `17450`, window `107917`, PID-derived DevTool
  `localhost:8901`, session 1, rendered checked background/border `#0169cc`; after
  a real row click, unchecked resolved to `#cfcfcf` with `hsla(0,0%,5%,.14)`
  border while retaining the 200ms transform transition. The exact Native console
  was empty and no screenshot was retained. The final staged bundle SHA-256 is
  `47f8dfb351f59ce86c6275165c5c3321e1d7bf17a45fd574b528976f274b5f70`.

### DS-066 — COMPLETE

- Native outline Badge now matches Electron's hierarchy: elevated opaque surface,
  standard border, and full foreground text. It previously used a transparent
  surface with muted copy, making file-type and identity badges read too faint.
- The focused Badge suite passes 2/2 and the affected Lynx/Desktop production
  build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `31468`, window `107967`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the small outline story with white opaque
  surface, `hsla(0,0%,5%,.069)` border, foreground `rgb(13,13,13)`, and 9px/14px
  medium text. The exact Native error/warning console was empty and no screenshot
  was retained. The final staged bundle SHA-256 is
  `9b206fb4ead7ca1d9e17fe02553c89922ae249acf510bf280b1d4a14895b826f`.

### DS-064 — COMPLETE

- Shared Native `MenuItem` now supports Electron's destructive variant, routing
  destructive labels through `--destructive` instead of ordinary foreground. The
  paired separator story's Remove action now exercises the real shared variant.
- Native Menu/Lab focused tests pass 23/23 and the affected Lynx/Desktop
  production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `4112`, window `107889`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the separator story. Remove resolved to
  destructive `rgb(224,46,42)` while retaining the shared 12px/18px item type.
  The exact Native error/warning console was empty and no screenshot was retained.
  The final staged bundle SHA-256 is
  `0b03edfa4ca69951084d983a65f1b74e48a1b5046795a89500b2fcac1b872f0d`.

### DS-067 — COMPLETE

- Native destructive Badge now preserves Electron's white foreground in dark
  theme instead of inheriting the near-black primary foreground over the
  destructive red surface. The override is scoped to destructive Badge text, so
  the other Badge hierarchy and semantic status variants remain unchanged.
- The paired `ui/badge` catalog now exposes the destructive variant in both
  renderers, increasing meaningful matrix coverage from 3,368 to 3,376 cells.
  Native Badge/Lab tests pass 3/3, Web Lab tests pass 37/37, shared manifest
  tests pass 9/9, and the affected Lynx/Desktop production build passes on npm
  Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `59559`, window `107997`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the dark destructive story with
  background `rgb(224,46,42)` and text `rgb(255,255,255)`. Native retained its
  compact 10px/16px medium type and 29x16px content box; Electron independently
  resolved the destructive foreground to the same white. The exact Native
  error/warning console was empty, no screenshot was retained, and the final
  staged bundle SHA-256 is
  `a3958eb35feb8924f19d9117fa0e8f02694eae94eccc4242365f49c72df5f43f`.

### DS-068 — COMPLETE

- Native destructive Button now preserves Electron's fixed white foreground in
  dark theme instead of using the semantic destructive text token, which resolves
  to near-black for destructive text on neutral surfaces. The token remains
  unchanged for menu labels and destructive-outline controls.
- Native Button/Lab focused tests pass 6/6, shared manifest tests pass 9/9, and
  the affected Lynx/Desktop production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `71799`, window `108025`, PID-derived DevTool
  `localhost:8901`, session 1, rendered the dark destructive story with
  background `rgb(224,46,42)` and text `rgb(255,255,255)` at the shared 12px
  medium tier. Electron independently resolved the same red and white pair. The
  exact Native error/warning console was empty, no screenshot was retained, and
  the final staged bundle SHA-256 is
  `7034be2fc98b72c1d9ff6760cc284263fcfcef9d908158ac7ca370c51444dc20`.

### DS-069 — COMPLETE

- Native destructive Button now gives all four 1px border edges the same
  destructive red as Electron and the fill. The inherited transparent border
  previously changed edge antialiasing and disabled/focus blending despite the
  center surface looking similar.
- The implementation uses explicit side colors because Lynx parsed the
  `border-color` shorthand but left all four rendered side colors transparent.
  The focused Native Button suite passes 5/5, and the affected Lynx/Desktop
  production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `85036`, window `108082`, PID-derived DevTool
  `localhost:8901`, session 1, measured 1px top/right/bottom/left borders at
  `rgb(224,46,42)`, matching both the Native fill and Electron's four rendered
  edges. White foreground remained intact, the exact Native error/warning console
  was empty, no screenshot was retained, and the final staged bundle SHA-256 is
  `4b5144308953c8fdbeb139413a560c6bbad664e9fe2d0b37508d140aae3c024a`.

### DS-070 — COMPLETE

- Native ghost and chrome Button labels now start at Electron's secondary
  foreground level and promote to full foreground only for hover, active, and
  pressed states. Link buttons retain their full foreground role. This restores
  hierarchy for toolbar and secondary actions that previously appeared active at
  rest.
- Native Button/Lab focused tests pass 6/6, and the affected Lynx/Desktop
  production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `92632`, window `108114`, PID-derived DevTool
  `localhost:8901`, session 1, measured default ghost text at
  `rgba(252,252,252,0.576471)`, matching Electron's 58% secondary foreground. A
  real click on the Lab hover state changed the rendered class to `ui-hover`,
  promoted text to `rgb(252,252,252)`, and applied the 3.5% hover surface. The
  exact Native error/warning console was empty, no screenshot was retained, and
  the final staged bundle SHA-256 is
  `3338c7a4353df56dc5396c963b4963a7fb0a76ba94d47a671776010e87e00f4f`.

### DS-071 — COMPLETE

- Native unchecked Checkbox now carries Electron's dark-theme `input/32`
  control surface instead of remaining transparent. The surface is derived from
  the active Theme Pack's opaque control background, so custom themes retain the
  same contract without a default-theme color literal. Light unchecked remains
  transparent, and checked/mixed states still use primary fill.
- Native Checkbox/theme/Lab focused tests pass 14/14, and the affected
  Lynx/Desktop production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `5542`, window `108155`, PID-derived DevTool
  `localhost:8901`, session 1, measured unchecked dark background
  `rgba(23,23,23,0.317647)`, light border `hsla(0,0%,99%,.046)`, and the existing
  16x16 box. A real Lab state click changed checked fill and border to primary
  `rgb(252,252,252)`. Electron independently resolved its unchecked surface to
  the equivalent 32% control color. The exact Native error/warning console was
  empty, no screenshot was retained, and the final staged bundle SHA-256 is
  `40db41a16b0767fc207a26160206ed4cfaa1fa0d1b10e5614f9ac351ad8d0ef8`.

### DS-072 — COMPLETE

- Native primary and destructive filled Buttons now expose Electron's 90%
  hover/pressed fill feedback instead of remaining visually static. Theme-derived
  opaque colors reproduce alpha compositing against the active surface while
  avoiding Lynx's incorrect rendering of alpha colors stored in dynamic CSS
  variables.
- The two dynamic tokens also have static light/dark declarations because Lynx
  drops root custom properties that are not registered in a stylesheet. Native
  Button/theme/Lab focused tests pass 15/15, and the affected Lynx/Desktop
  production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `35152`, window `108239`, PID-derived DevTool
  `localhost:8901`, session 1, measured primary hover at opaque
  `rgb(229,229,229)` and destructive pressed at `rgb(204,43,40)`. The latter
  retained white text and four destructive-red border edges. The exact Native
  error/warning console was empty, no screenshot was retained, and the final
  staged bundle SHA-256 is
  `29602c151d6fd8a2a0d610f9e96b78ff04d407d888043cfb607784546379eacb`.

### DS-073 — COMPLETE

- Native primary-outline, secondary-outline, and destructive-outline Buttons
  now use Electron's elevated opaque surface instead of a transparent fill. The
  variants are exposed in the paired Button Lab matrix so their theme/state
  contracts are directly inspectable rather than only reachable through product
  consumers.
- Coverage grows from 3,376 to 3,496 meaningful cells. Native Button/Lab tests
  pass 6/6, Web Lab tests pass 37/37, shared manifest tests pass 9/9, and the
  affected Lynx/Desktop production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `46091`, window `108280`, PID-derived DevTool
  `localhost:8901`, session 1, rendered destructive-outline with dark elevated
  surface `rgb(23,23,23)`, destructive text `rgb(224,46,42)`, and the shared
  approximately 7% border. Electron independently resolved the same three roles.
  The exact Native error/warning console was empty, no screenshot was retained,
  and the final staged bundle SHA-256 is
  `4732e1e0c27b308901cfd966597af8cdebe6d9b64fa0213aacd90bf7c3118ed0`.

### DS-074 — COMPLETE

- Native Button now exposes an explicit `LxButton--variant-*` namespace in
  addition to its existing size class. Previously both the default variant and
  default size emitted `LxButton--default`, so the new filled hover selector also
  matched every default-size outline button and painted primary-outline hover as
  a bright filled primary action.
- Filled primary state selectors now target `LxButton--variant-default`; all
  existing size classes remain unchanged. Native Button/Lab focused tests pass
  7/7, and the affected Lynx/Desktop production build passes on npm Lynxtron
  0.0.22.
- Exact-owned Lynxtron PID `66103`, window `108382`, PID-derived DevTool
  `localhost:8901`, session 1, rendered primary-outline hover with both
  `LxButton--variant-primary-outline` and the existing size class. Its surface
  remained dark elevated `rgb(23,23,23)` with the standard light border and full
  foreground instead of the erroneous primary fill. The exact Native
  error/warning console was empty, no screenshot was retained, and the final
  staged bundle SHA-256 is
  `9608016bc321c4be4f4d076faec6b89cdcbd36b77eb3d4c6ab0cd2ed18e0f0c8`.

### DS-075 — COMPLETE

- Native primary-outline and destructive-outline Buttons now match Electron's
  semantic hover/active/pressed paint: a 4% role tint over the elevated default
  surface and a 32% role border. The role colors are derived from the active
  Theme Pack and registered for Native custom-property resolution.
- Border colors use explicit top/right/bottom/left declarations because Lynx can
  parse an aggregate variable-backed `border-color` without applying it to the
  rendered sides. Native Button/theme/Lab focused tests pass 16/16, and the
  affected Lynx/Desktop production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `74929`, window `108410`, PID-derived DevTool
  `localhost:8901`, session 1, rendered destructive-outline hover with 4% red
  surface `rgba(224,46,42,0.0392157)`, four 1px 32% red borders
  `rgba(224,46,42,0.317647)`, and destructive-red text. The exact Native
  error/warning console was empty, no screenshot was retained, and the final
  staged bundle SHA-256 is
  `f3883440c1c0623539678fdff9a0c6231072d0e14ff3e4b0f39f0fe677b9ed72`.

### DS-076 — COMPLETE

- Native secondary-outline Button now implements Electron's subtle
  `secondary/12` hover/active/pressed surface instead of remaining on the
  elevated default surface. The effective secondary alpha is composited into the
  active Theme Pack's surface before reaching Lynx, avoiding Native's quantization
  of the default dark 0.312% alpha to transparent.
- Static light/dark declarations register the dynamic token with the Native style
  engine. Native Button/theme/Lab focused tests pass 16/16, and the affected
  Lynx/Desktop production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `92545`, window `108476`, PID-derived DevTool
  `localhost:8901`, session 1, measured dark secondary-outline hover at opaque
  `rgb(17,17,17)` with the standard light border and full foreground. The first
  alpha-token attempt rendered fully transparent and was rejected before this
  final run. The exact Native error/warning console was empty, no screenshot was
  retained, and the final staged bundle SHA-256 is
  `808a9b53399b1d00161612a32b60f8b952919a58ccbe31e939ffad95ae9bc38f`.

### DS-077 — COMPLETE

- Native outline, chrome-outline, and chrome Buttons now expose Electron's
  elevated-secondary surface for hover, active, and pressed states instead of
  applying it only during active. The effective translucent color is composited
  into the active Theme Pack surface before Native rendering, avoiding Lynx's
  low-alpha quantization.
- The dedicated dynamic token has static light/dark declarations for Native
  registration. Native Button/theme/Lab focused tests pass 16/16, and the
  affected Lynx/Desktop production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `7940`, window `108535`, PID-derived DevTool
  `localhost:8901`, session 1, rendered dark outline hover at opaque
  `rgb(17,17,17)` with the standard light border and full foreground. Electron's
  real pointer hover resolved to the equivalent 0.8% white surface over
  `#101010`; the prior Native alpha path rendered only 0.4% and was rejected. The
  exact Native error/warning console was empty, no screenshot was retained, and
  the final staged bundle SHA-256 is
  `78c2ffd456f5ec1bd3e5036e9ed2e9294208309d8b5f6057ccd24c8cd474a65e`.

### DS-078 — COMPLETE

- Native secondary Buttons now match Electron's 90%-of-secondary hover and
  pressed surface instead of staying at the default fill on hover and jumping to
  the stronger generic hover token on pressed. Subtle Buttons use the dedicated
  secondary-hover surface for all three interaction states.
- Both state colors are precomposited into the active Theme Pack surface and
  registered in Native theme blocks, avoiding low-alpha quantization. Native
  Button/theme/Lab focused tests pass 16/16, and the affected Lynx/Desktop
  production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `17071`, window `108563`, PID-derived DevTool
  `localhost:8901`, session 1, measured both secondary hover and pressed at
  opaque `rgb(22,22,22)` with secondary foreground `rgb(104,104,104)`. Subtle
  state remains source/test evidence because it has no dedicated Lab variant. The
  exact Native error/warning console was empty, no screenshot was retained, and
  the final staged bundle SHA-256 is
  `edf7dd3408855b139eca4451f0171f32f9cfd942af701055e7c5ca5e768ef648`.

### DS-079 — COMPLETE

- Native prominent Button now animates its existing hover scale with Electron's
  150ms transform/opacity transition instead of jumping instantly. The shared
  reduced-motion branch collapses the transition to 0.01ms, while disabled hover
  remains unscaled.
- Native Button/Lab focused tests pass 7/7, and the affected Lynx/Desktop
  production build passes on npm Lynxtron 0.0.22.
- Exact-owned Lynxtron PID `30219`, window `108628`, PID-derived DevTool
  `localhost:8901`, session 1, rendered prominent hover at `scale(1.05)` with
  `[transform, opacity]`, 150ms, ease-out transition metadata. The exact Native
  error/warning console was empty, no screenshot was retained, and the final
  staged bundle SHA-256 is
  `fba6385fc105566679b3134397c56cebe4c2dc9e9d462f3298b5154df9dce061`.
