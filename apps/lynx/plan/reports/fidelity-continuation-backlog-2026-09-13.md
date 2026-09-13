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

- Component identity: 48 stories, 96 renderer mappings, 3,192 meaningful
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

### AF-005 — COMPLETE

- The populated automation detail now has a paired Components Lab story with
  active and paused variants. Native mounts the production
  `AutomationDetailPage`; Electron's route and Lab story share the extracted
  production `AutomationDetailComposition` for the page shell and Status group.
- Page-level previews use an explicit 880×520 canvas, so the split pane, complete
  Details group, and Previous runs area remain visible instead of being clipped
  by the component-sized target. Exact-owned Native confirmed the active and
  paused status/action changes and 11 detail labels with an empty console.

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

- Exact-owned Native: workspace Lynxtron `0.0.22`, PID `38396`, PID-derived
  DevTool `localhost:8901`, session 1, 1280×820 light product states.
- Focused Native: 39/39 passed.
- Focused Web automation: 33/33 passed.
- React Doctor 0.9.11 changed-lines scan: zero errors and zero warnings
  across 12 changed Native files and the shared Web form helper.
- Component identity: 96/96 mappings across 48 stories.
- Primitive inventory: zero missing Native counterparts and zero counterparts
  omitted from the Lab.
- Production build passed. Final staged bundle SHA-256:
  `0154aff177b6147cb769d7e9ccab5b54b007e3fb027e3fa3b68e7f68df3773c0`.
- `audit:style:check` and `audit:reuse:check` remain excluded from the green
  gate because their generated baselines are pre-existing user-owned changes;
  neither baseline was rewritten by this task.
