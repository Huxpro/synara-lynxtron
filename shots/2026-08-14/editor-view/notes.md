# Lynx thread Editor view

## Newly discovered scope

- Web authority state: thread route with `view=editor`.
- User entry: Environment → Editor → Editor view, plus the thread header
  Editor action.
- Before: Lynx rendered the correctly labeled `Editor view` row but wired it
  to `setExplorerVisibility(true)`, opening only the Files right dock.
- After: the action opens a dedicated full-window Editor composition with a
  Files activity rail, file tree/search, syntax/image/PDF/Markdown preview,
  and a live Chat rail for the same thread. Chat exits back to the ordinary
  thread surface.

## Shared behavior

- Reuses `ExplorerDock` in an embedded `editor` presentation instead of
  copying file-tree or preview logic.
- Reuses the same thread transcript, composer, provider health, project
  identity, workspace root, query data, selected path, expanded directories,
  and file-comment draft path.
- Persists the per-thread Files/Changes center mode and expanded directories
  through the existing shared `editorViewState`.
- Web and Native deterministic harnesses accept `editor=open` init data; this
  does not alter the product URL in Lynx memory history.
- Opening Editor closes Environment, Files/Changes right docks, and Terminal
  so the surfaces cannot overlap.

## Harness identity

- Shared isolated server: `ws://127.0.0.1:58090`.
- Shared state: `.synara-fidelity-editor/dev/state.sqlite`.
- Canonical records created through `orchestration.dispatchCommand`:
  - project `project-editor-fidelity`
  - thread `thread-editor-fidelity`
  - workspace `/tmp/synara-editor-fidelity`
- Workspace is a real Git repository with:
  - `README.md`
  - `src/editor.ts`
  - one tracked modification in `src/editor.ts`
- Viewport: `1280x820`, DPR 1, light.
- Web authority and Lynx-for-Web were captured sequentially because the
  isolated server admits only its configured trusted browser origin.

## Runtime evidence

- Lynx route:
  `?route=/thread/thread-editor-fidelity&editor=open&explorerPath=src/editor.ts`.
- Real RPCs included:
  - thread detail and sidebar shell snapshots
  - `projects.listDirectories`
  - `projects.readFile`
  - syntax highlighting for `src/editor.ts` as TypeScript
- Rendered preview contained the real changed source:
  `export const editorFidelity = "changed";`.
- Chat rail retained the real thread title, empty-thread composer, model and
  runtime controls, project name, environment mode, and branch.
- Retained Lynx frame:
  `lynx-for-web-files-light-1280x820.png`, `1280x820`, non-zero RGB
  standard deviation.

### Changes activity mode

- Newly closed scope: Web Editor activity-bar `Changes` mode.
- Canonical records created through `orchestration.dispatchCommand`:
  - project `editor-changes-project`
  - thread `editor-changes-thread`
  - workspace `/private/tmp/synara-editor-changes`
- The workspace is a real Git repository. Final retained state contains only
  one tracked modification in `index.ts`; screenshots and diagnostic files
  created during discovery were removed before the final capture.
- Deterministic Lynx route:
  `?route=/thread/editor-changes-thread&editor=open&editorMode=diff`.
- The final `1280x820`, DPR 1 frame rendered the real `index.ts` working-tree
  patch with `+2 -1`; it no longer remained at `Loading changes…`.
- Relay diagnostics recorded `git.readWorkingTreeDiff`, zero pending
  requests, and no transport or RPC error.
- The permanent Loading state was a real product race, not a renderer delta:
  an independently mounted diff query could start before the Web relay bridge
  became ready and lose its callback. Cold-start Editor Changes now reads the
  patch in the established thread bootstrap sequence and seeds the shared
  `DiffDock` React Query cache. Explicit refreshes continue through the
  canonical working-tree diff RPC.
- Final evidence is retained outside the repository:
  `/tmp/synara-editor-changes-lynx-final.png`,
  `/tmp/synara-editor-changes-lynx-final.txt`, and
  `/tmp/synara-editor-changes-lynx-final.json`.

### Changes center geometry and first-file readability

- Newly discovered scope: the wide `1280x820`, dark Editor Changes layout
  after the loading race was closed.
- Harness identity was matched before classification:
  - same `.synara-fidelity-editor-changes` server state
  - same project `editor-changes-project`
  - same thread `editor-changes-thread`
  - same `/private/tmp/synara-editor-changes` Git workspace
  - same sole tracked `index.ts` patch (`+2 -1`)
  - same `1280x820`, DPR 1, dark theme
  - Web and Lynx ran sequentially against port `59260` because each server
    instance admitted only its configured renderer origin.
- Web authority geometry:
  - activity rail: `x=0`, `48x774`
  - changed-files sidebar: `x=48`, `224x774`
  - selected-file diff viewport: `x=272`, `624x774`
  - Chat rail: `x=896`, `384x774`
  - the selected `index.ts` patch lines were visible immediately.
- Pre-fix Lynx geometry:
  - activity rail: `x=0`, `48x774`
  - Editor center: `x=48`, `848x774`
  - embedded `DiffDock`: `x=48`, `640x774`
  - dead center area: `208x774`, or `24.5%` of the Editor center width
  - the only file was collapsed, so no patch line was visible.
- Root cause: embedded Editor Changes reused the standalone right-dock
  `ResizableRightPanel` defaults. Its calculated 640px width overrode the
  Editor CSS `width: 100%`, and its standalone collapsed-file default was
  carried into a selected-file authority state.
- Fix: `DiffDock` now has an explicit `editor` presentation. Editor mode
  disables right-dock resizing, fills the complete center, and defaults the
  first real file open. The standalone Changes dock retains its resizable,
  collapsed-file behavior.
- Post-fix Lynx geometry:
  - Editor center: `x=48`, `848x774`
  - embedded `DiffDock`: `x=48`, `847x774`
  - dead center area: effectively `0px` apart from the existing 1px divider
  - four real unified-diff rows are rendered for `index.ts`
  - no Editor resize sash is mounted
  - relay diagnostics: `git.readWorkingTreeDiff`, zero pending requests, no
    transport or RPC error.
- Evidence:
  - `/tmp/synara-editor-geometry-web.png`
  - `/tmp/synara-editor-geometry-web.json`
  - `/tmp/synara-editor-geometry-lynx.png`
  - `/tmp/synara-editor-geometry-lynx.json`
  - `/tmp/synara-editor-geometry-lynx-fixed.png`
  - `/tmp/synara-editor-geometry-lynx-fixed.json`

### Compact Editor mode navigation

- Newly discovered scope: `390x844`, DPR 1, dark Editor Changes.
- Harness identity matched the wide cell:
  - same `.synara-fidelity-editor-changes` state and port `59260`
  - same project, thread, workspace, and sole `index.ts +2 -1` patch
  - Web and Lynx again ran sequentially with renderer-specific trusted origins.
- Compact Web authority keeps the Editor activity rail:
  - rail: `x=0`, `48x798`
  - changed-files sidebar: `x=48`, `342x176`
  - selected-file diff: `x=48`, `342x334`
  - Chat rail: `x=48`, `342x288`
- Pre-fix compact Lynx:
  - activity rail: `display:none`, `0x0`
  - diff center: `x=0`, `390x399`
  - Chat rail: `x=0`, `390x399`
  - the patch remained readable, but the only Files/Changes navigation was
    removed, so the user could not switch Editor modes.
- Root cause: the compact/medium fallback changed `ThreadEditorBody` to a
  column and hid `ThreadEditorActivityRail` instead of preserving the
  authority's fixed rail beside vertically stacked content.
- Fix: compact and medium Editor now use a two-column, two-row grid. The 48px
  activity rail spans both rows; center and Chat occupy the two rows to its
  right.
- Post-fix compact Lynx:
  - rail: `x=0`, `48x798`, `grid-row: 1 / 3`
  - diff center: `x=48`, `342x399`
  - Chat rail: `x=48`, `342x399`
  - four real patch rows remain visible
  - relay remains healthy with zero pending requests and no RPC error.
- Retained evidence:
  - `/tmp/synara-editor-compact-web.png`
  - `/tmp/synara-editor-compact-web.json`
  - `/tmp/synara-editor-compact-lynx.png`
  - `/tmp/synara-editor-compact-lynx.json`
  - `/tmp/synara-editor-compact-lynx-fixed.png`
  - `/tmp/synara-editor-compact-lynx-fixed.json`
- The rail's product wiring is covered by focused source tests. Real
  Lynx-for-Web click publication remains under the existing
  `lynx-web-pointer-to-bindtap` harness blocker and is not claimed here.

### Compact Editor Files readability

- Newly discovered scope: `390x844`, DPR 1, dark Editor Files with canonical
  `editorFilePath=index.ts` / `explorerPath=index.ts` selection.
- Identity remained matched to the same project, thread, workspace, server
  state, and viewport used by compact Changes.
- Web authority:
  - activity rail: `x=0`, `48x798`
  - file tree: `x=48`, `342x176`
  - selected file preview: `x=48`, `342x334`
  - Chat rail: `x=48`, `342x288`
  - the real two-line TypeScript file was readable across the full 342px
    content width.
- Pre-fix Lynx:
  - activity rail: `x=0`, `48x798`
  - Editor center: `x=48`, `342x399`
  - file tree: `x=48`, `224x354`
  - selected file preview: `x=272`, `118x354`
  - the file data and syntax highlighting were healthy, but the fixed wide
    sidebar left only 34.5% of the center width for code.
- Root cause: `ExplorerDock--editor` fixed its sidebar at 224px and always kept
  `ExplorerDockBody` in a row. Unlike Web's responsive workspace sidebar, it
  had no compact/medium editor presentation override.
- Fix: compact and medium embedded Explorer bodies stack vertically. The file
  tree becomes `100% x 176px`; the preview consumes the remaining height.
  Wide Editor and the standalone Explorer dock keep their horizontal layout.
- Post-fix Lynx:
  - file tree: `x=48`, `342x176`
  - selected file preview: `x=48`, `342x178`
  - real `index.ts` contents remain visible
  - `projects.listDirectories`, `projects.readFile`, and TypeScript syntax
    highlighting completed with no relay error.
- Evidence:
  - `/tmp/synara-editor-files-web.png`
  - `/tmp/synara-editor-files-web.json`
  - `/tmp/synara-editor-files-lynx.png`
  - `/tmp/synara-editor-files-lynx.json`
  - `/tmp/synara-editor-files-lynx-fixed.png`
  - `/tmp/synara-editor-files-lynx-fixed.json`
- Harness timing noise: the first Web accessibility snapshot reported an
  empty page even though `#root` already contained the complete Editor DOM.
  A normal route reload exposed the stable tree; the empty snapshot was
  discarded and contributes `0.00` product loss.

### Editor changed-files selection

- Newly discovered scope: wide and compact Editor Changes with two real
  tracked modifications:
  - `index.ts`, `+2 -1`
  - `src/helper.ts`, `+2 -1`
- The fixture was prepared through normal Git operations in the canonical
  workspace; no SQLite or renderer fixture data was written.
- Web authority:
  - wide changed-files sidebar: `x=48`, `224px` wide
  - clicking `helper.ts` selected its row without changing the route URL
  - the center projected only the selected helper patch.
- Previous Lynx behavior displayed every file as collapsible sections in one
  long stream. It had no authority-equivalent changed-files sidebar or
  selected-file projection, so large workspaces could not browse one patch at
  a time.
- Fix:
  - Editor-only `DiffDock` now renders a 224px changed-files sidebar from the
    existing portable diff view;
  - selection filters the shared `PullRequestCodeComposition` to one file;
  - standalone Changes keeps its existing all-file stream;
  - compact/medium Editor stacks the full-width sidebar at `176px` above the
    selected patch, matching the existing responsive Editor anatomy.
- Runtime evidence:
  - wide default: sidebar `224x730`, center `623x730`, `index.ts` selected,
    only its four unified-diff rows rendered;
  - deterministic helper state: helper row selected, center path
    `src/helper.ts`, helper baseline/change lines rendered;
  - compact helper state: rail `48x798`, sidebar `342x176`, patch
    `342x178`, Chat `342x399`;
  - relay settled with zero pending requests and no transport/RPC error.
- Evidence:
  - `/tmp/synara-editor-multifile-web-helper.png`
  - `/tmp/synara-editor-multifile-web-before.json`
  - `/tmp/synara-editor-multifile-web-after.json`
  - `/tmp/synara-editor-multifile-lynx.png`
  - `/tmp/synara-editor-multifile-lynx.json`
  - `/tmp/synara-editor-multifile-lynx-helper.png`
  - `/tmp/synara-editor-multifile-lynx-helper.json`
  - `/tmp/synara-editor-multifile-lynx-compact.png`
  - `/tmp/synara-editor-multifile-lynx-compact.json`
- Web authority supplied retained real click evidence. Lynx-for-Web runtime
  row clicks remain under `lynx-web-pointer-to-bindtap`; deterministic
  `explorerPath=src/helper.ts` verifies the identical product projection
  without claiming that blocked interaction.

### Editor Chat visibility

- Newly discovered scope: compact `390x844` Editor Changes with the Chat pane
  hidden through the real Web header control.
- Web authority after the retained click:
  - activity rail: `48x798`
  - changed-files sidebar: `342x176`
  - selected patch viewport expanded from `342x334` to `342x622`
  - Chat pane: `display:none`, `0x0`
  - header action changed from `Hide chat panel` to `Show chat panel`.
- Previous Lynx behavior always mounted a 384px wide Chat pane on wide screens
  and half-height Chat on compact/medium screens. Users could not reclaim the
  workspace even though the authority exposed this as a primary Editor header
  action.
- Fix:
  - moved the existing `synara.editor.chatPaneVisible` preference into shared
    `editorViewState` APIs used by both renderers;
  - added a Lynx `Hide chat` / `Show chat` header action;
  - hidden Chat remains mounted in both renderers and is removed from layout
    through each renderer's hidden presentation;
  - compact/medium centers span both grid rows while Chat is hidden;
  - deterministic Web and Native init accept `editorChat=hidden|open`.
- Post-fix Lynx:
  - compact: rail `48x798`, center `342x798`, changed-files sidebar
    `342x176`, patch `342x577`, Chat `0x0`;
  - wide: rail `48x774`, center `1232x774`, sidebar `224x730`, patch
    `1007x730`, Chat `0x0`;
  - header reads `Show chat`;
  - relay settled with no pending requests or RPC error.
- Evidence:
  - `/tmp/synara-editor-chat-hidden-web.png`
  - `/tmp/synara-editor-chat-hidden-web.json`
  - `/tmp/synara-editor-chat-hidden-lynx.png`
  - `/tmp/synara-editor-chat-hidden-lynx.json`
  - `/tmp/synara-editor-chat-hidden-lynx-wide.png`
  - `/tmp/synara-editor-chat-hidden-lynx-wide.json`
- Web supplied the real retained toggle click. Lynx deterministic init proves
  the hidden/open layouts; Lynx-for-Web runtime toggle clicks remain under the
  shared dynamic-event blocker.

### Clean working-tree state

- Newly discovered scope: wide, dark Editor Changes after restoring both
  tracked fixture files to a clean Git state.
- Web authority rendered `No changes in the selected diff source.` with no
  changed-file rows.
- Previous Lynx reused the shared pull-request composition's default empty
  copy, `This pull request has no file changes.`, inside a local working-tree
  surface.
- Fix: the portable pull-request composition accepts an optional empty label;
  `DiffDock` supplies `No working tree changes.` while pull-request callers
  retain their original copy.
- Post-fix Lynx:
  - `git.readWorkingTreeDiff` completed with zero pending/error;
  - no empty changed-files sidebar was mounted;
  - the notice reads `No working tree changes.`.
- This is an intentional wording delta from Web's generic selected-source copy:
  Lynx names the actual local working-tree scope and does not imply a pull
  request.
- Evidence:
  - `/tmp/synara-editor-clean-web.png`
  - `/tmp/synara-editor-clean-web.json`
  - `/tmp/synara-editor-clean-lynx.png`
  - `/tmp/synara-editor-clean-lynx.json`
- The Web page was fully present in `#root`, but two ordinary
  `agent-browser` accessibility/`innerText` reads returned empty output.
  Direct product-node `textContent` and geometry proved the authority state;
  the empty reads are retained as harness timing noise, not product loss.

### Non-Git workspace state

- Newly discovered failure state: the canonical Editor workspace temporarily
  had its `.git` directory atomically renamed while keeping the same project,
  thread, route, theme, and viewport.
- Web authority rendered:
  `Turn diffs are unavailable because this project is not a git repository.`
- Pre-fix Lynx called `git.readWorkingTreeDiff`, received an empty patch from
  the server projection, and rendered `No working tree changes.`. A non-Git
  workspace was therefore indistinguishable from a healthy clean repository.
- Fix:
  - Editor bootstrap now probes `git.listBranches`;
  - `isRepo=false` supplies an explicit unavailable state and skips the diff
    query;
  - repository-probe failures use the generic `Couldn’t load changes.` state
    rather than claiming either clean or non-Git;
  - `DiffDock` disables its query while an unavailable label is present.
- Post-fix Lynx rendered:
  `Changes are unavailable because this workspace is not a Git repository.`
- Relay evidence contained `git.listBranches`, no
  `git.readWorkingTreeDiff`, zero pending requests, and no transport/RPC
  error. No empty changed-files sidebar was mounted.
- The `.git` directory was restored to its original path after the owned
  harness exited, and `git diff --quiet` returned success.
- Evidence:
  - `/tmp/synara-editor-failure-web.png`
  - `/tmp/synara-editor-failure-web.json`
  - `/tmp/synara-editor-failure-lynx.png`
  - `/tmp/synara-editor-failure-lynx.json`
  - `/tmp/synara-editor-failure-lynx-fixed.png`
  - `/tmp/synara-editor-failure-lynx-fixed.json`

### Medium Editor Changes allocation

- Newly discovered viewport: `800x820`, DPR 1, dark, two-file Editor Changes.
- Web authority:
  - activity rail: `48x774`
  - changed-files sidebar: `752x176`
  - selected patch: `752x310`
  - Chat: `752x288`
- Pre-fix Lynx:
  - repeated an embedded 44px `Changes` header already represented by the
    Editor header;
  - split the remaining body 50/50;
  - sidebar: `752x176`
  - selected patch: only `752x166`
  - Chat: `752x387`.
- Root cause: the embedded dock retained standalone header chrome, while the
  compact/medium Editor grid used equal rows instead of the authority's
  workspace-first allocation.
- Fix:
  - Editor presentation omits standalone `DiffDockHeader`; standalone Changes
    keeps it;
  - compact/medium Editor uses `5fr / 3fr` workspace/Chat rows.
- Post-fix Lynx:
  - no embedded dock header
  - sidebar: `752x176`
  - selected patch: `752x306.75`
  - Chat: `752x290.25`
  - both real changed files remain present and relay diagnostics are clean.
- The remaining approximately 3px row-allocation difference is accepted
  rendering noise from fractional grid distribution, not interaction or
  content loss.
- Evidence:
  - `/tmp/synara-editor-medium-web.png`
  - `/tmp/synara-editor-medium-web.json`
  - `/tmp/synara-editor-medium-lynx.png`
  - `/tmp/synara-editor-medium-lynx.json`
  - `/tmp/synara-editor-medium-lynx-fixed.png`
  - `/tmp/synara-editor-medium-lynx-fixed.json`

### Compact Editor header

- Newly discovered scope: `390x844`, dark Editor header with Chat visible.
- Web authority:
  - project title: `94.7x19.5`
  - workspace path: hidden
  - Switch project: `28x28`
  - Hide Chat: `34x28`
  - Chat exit: `88x28`
  - every action remained within the 390px header.
- Pre-fix Lynx actions were still usable, so this was not promoted to P1.
  However, the workspace path and mode label remained visible, compressing
  `Editor Changes` into a `64.2x32` two-line block while Web intentionally
  hides secondary identity at this width.
- Fix:
  - project title does not wrap;
  - compact/medium Editor hides workspace path and redundant mode label;
  - Hide Chat and Chat controls remain unchanged.
- Post-fix Lynx:
  - project title: `94.7x16`, one line
  - path and mode: `display:none`, `0x0`
  - Hide Chat ends at `x=332.8`
  - Chat exit ends at `x=378`, inside the 390px viewport.
- Evidence:
  - `/tmp/synara-editor-header-web.png`
  - `/tmp/synara-editor-header-web.json`
  - `/tmp/synara-editor-header-lynx.png`
  - `/tmp/synara-editor-header-lynx.json`
  - `/tmp/synara-editor-header-lynx-fixed.png`
  - `/tmp/synara-editor-header-lynx-fixed.json`

### Editor Search activity

- Newly closed explicit residual: the Web Editor activity rail's third Search
  mode.
- Web authority was entered through the real `Search files` rail button:
  - third rail action became `Hide search sidebar`
  - search sidebar: `x=48`, `224x774`
  - search input: `205x21`
  - preview center: `x=272`, `624x774`
  - route URL remained unchanged.
- Fix:
  - added the third Lynx rail item using the existing `SearchIcon`;
  - Search mode reuses `ExplorerDock` query, result, selection, preview,
    syntax, image, PDF, and Markdown data instead of adding a parallel search
    implementation;
  - selecting Files or Changes exits Search while preserving the underlying
    Files/Changes center mode;
  - `editor-search` presentation removes the duplicate Files header;
  - deterministic Web/Native init accepts `editorSearch=open`.
- Post-fix Lynx wide:
  - third rail item is the sole active item
  - no duplicate Explorer header
  - sidebar: `x=48`, `224x774`
  - preview: `x=272`, `623x774`
  - search input: `207x28`.
- Post-fix Lynx compact:
  - rail: `48x798`
  - search sidebar: `342x176`
  - preview: `342x321.75`
  - Chat: `342x299.25`.
- The input-height difference is an accepted native-control rendering delta;
  sidebar and preview boundaries, state semantics, and real data paths match.
- Evidence:
  - `/tmp/synara-editor-search-web.png`
  - `/tmp/synara-editor-search-web.json`
  - `/tmp/synara-editor-search-lynx.png`
  - `/tmp/synara-editor-search-lynx.json`
  - `/tmp/synara-editor-search-lynx-compact.png`
  - `/tmp/synara-editor-search-lynx-compact.json`
- Web supplied the retained real rail click. Lynx deterministic init proves
  the same rendered state; runtime rail click evidence remains blocked by the
  shared dynamic-event issue.

### Editor project switching investigation

- Newly verified authority semantics used a second canonical project/thread
  created through `orchestration.dispatchCommand`:
  - project `editor-secondary-project`
  - thread `editor-secondary-thread`
  - workspace `/private/tmp/synara-editor-secondary`.
- Web's real project picker listed both projects as radio items. Selecting
  `Editor Secondary` navigated to
  `/editor-secondary-thread?view=editor`, preserved Editor mode, and rendered
  the secondary project, workspace, thread, and clean-diff state.
- A Lynx implementation trial reused the existing Menu primitive and the
  shared sidebar thread-ordering policy. Focused resolver tests and production
  build passed, but real Lynx-for-Web startup rendered an empty root whenever
  the Menu subtree was mounted in the Editor header, even with the menu closed.
- A deterministic default-open variant produced the same failure. There was no
  page-level JavaScript error, and a cold harness restart did not recover it.
  This is a renderer/component integration failure, not passing project-switch
  coverage.
- The entire trial was reverted. No disabled picker, fake title-only switch,
  approximate thread ordering, or empty-root regression remains.
- `lynx-editor-project-switching` remains P2 missing coverage. Its verified
  target contract is:
  - select the latest non-archived thread under the configured sidebar sort;
  - preserve Editor mode;
  - create/open a new Editor draft when the target project has no thread.
- Evidence:
  - `/tmp/synara-editor-project-web-after.png`
  - `/tmp/synara-editor-project-web-after.json`
  - `/tmp/synara-editor-project-lynx-menu.png`
  - `/tmp/synara-editor-project-lynx-primary.json`
  - `/tmp/synara-editor-project-lynx-secondary.json`
- Harness command noise: one Web readiness loop omitted URL quoting and zsh
  treated `?view=editor` as a glob. The owned process was stopped and restarted
  with a quoted URL; this contributes `0.00` product loss.

### Multi-file light theme

- Newly verified theme cell: wide `1280x820`, DPR 1, light, two-file Editor
  Changes.
- Theme was selected through the real Web Settings → Appearance → Light radio;
  no storage value was written directly.
- Web authority:
  - root tokens: background `#ffffff`, foreground `#0d0d0d`
  - changed-files sidebar: white surface, dark foreground, `224x774`
  - selected patch viewport: `624x774`.
- Lynx:
  - root tokens exactly `#ffffff` / `#0d0d0d`
  - changed-files sidebar: white surface, dark foreground,
    `rgba(13,13,13,0.07)` divider, `224x774`
  - selected patch viewport: `623x774`
  - selected row: `rgba(13,13,13,0.04)`
  - additions: `rgba(0,162,64,0.1)`
  - deletions: `rgba(224,46,42,0.1)`
  - Chat: `384x774`.
- Relay settled at zero pending requests with no transport/RPC error.
- No light-theme product loss was found. The 1px center-width difference is
  the existing divider accounting and accepted rendering noise.
- Evidence:
  - `/tmp/synara-editor-light-web.png`
  - `/tmp/synara-editor-light-web.json`
  - `/tmp/synara-editor-light-lynx.png`
  - `/tmp/synara-editor-light-lynx.json`
  - `/tmp/synara-editor-light-lynx-relay.json`

### Editor Chat resize contract

- Newly closed explicit residual: wide Editor Chat width uses the authority's
  persisted `320–600px` resize contract.
- Web authority defines:
  - default width `384`
  - minimum `320`
  - maximum `600`
  - keyboard step `24`
  - storage key `synara.editor.chatPaneWidth`
  - resizing only in the wide row layout.
- Fix:
  - moved width constants, clamp, read, and write helpers into shared
    `editorViewState`;
  - Web continues using the same behavior through the shared helpers;
  - Lynx wraps the Chat rail with the existing `ResizableRightPanel`, reusing
    its right-edge pointer math, missed-mouseup recovery, bounds, and
    persistence instead of adding another resize implementation;
  - router viewport state explicitly disables resizing below `lg`, avoiding a
    stale inline width during wide → compact transitions.
- Lynx wide runtime:
  - center: `848x774`
  - Chat: `384x774`
  - resize sash: `10x774` at the Chat left edge.
- The first compact transition exposed a real responsive regression:
  `ResizableRightPanel` briefly retained the 320px inline width and sash,
  leaving a 22px dead strip in the 342px content column.
- Post-fix compact:
  - center: `342x498.75`
  - Chat: `342x299.25`
  - no resize sash.
- Focused resize-logic tests cover right-edge direction, custom `320–600`
  bounds, movement threshold, and missed mouseup. Real Lynx-for-Web drag
  publication remains under the dynamic-event blocker and is not claimed.
- Evidence:
  - `/tmp/synara-editor-chat-resize-lynx-wide.png`
  - `/tmp/synara-editor-chat-resize-lynx-wide.json`
  - `/tmp/synara-editor-chat-resize-lynx-compact.json`
  - `/tmp/synara-editor-chat-resize-lynx-compact-fixed.json`

## Authority geometry

After aligning global-sidebar state, Web authority and Lynx use the same
critical Editor boundaries:

- full Editor surface: `1280x820`
- header: `1280x46`
- activity rail: `x=0`, `width=48`, `height=774`
- Files sidebar: `x=48`, `width=224`
- center preview: `x=272`, right edge `896`
- Chat rail: `x=896`, `width=384`, `height=774`

The first Web screenshot was captured while the app still showed its boot
splash and was rejected. Later `textContent`, geometry, computed styles,
accessibility snapshot, storage, and console probes establish the authority
comparison; no Web screenshot pass is claimed.

## Classification

- **P1 product behavior closed:** `Editor view` no longer opens a Files dock
  while claiming to open the editor.
- **P1 missing coverage closed:** Lynx now has the core Files + preview + Chat
  Editor composition.
- **Accepted renderer delta:** Web uses DOM-based draggable/resizable rails;
  Lynx uses a stable fixed 384px Chat rail and responsive stacked fallback.
- **P1 product behavior closed:** Editor Changes now renders the canonical
  working-tree patch instead of remaining at `Loading changes…`.
- **P1 missing coverage closed:** Lynx Editor now has the Web authority's
  Files and Changes activity modes, sharing the existing diff renderer.
- **P1 layout/readability closed:** Editor Changes no longer leaves a 208px
  dead strip or hides the selected file's entire patch by default.
- **P1 compact interaction closed:** compact/medium Editor no longer removes
  the only Files/Changes mode navigation.
- **P1 compact readability closed:** compact/medium Files no longer restricts
  the selected code preview to 118px.
- **P2 coverage closed:** Editor Changes now has a changed-files sidebar and
  selected-file projection.
- **P2 coverage closed:** Editor Chat can be hidden and shown, preserving the
  shared visibility preference and reclaiming the workspace.
- **P1 semantic copy closed:** clean working-tree state no longer describes
  itself as a pull request.
- **P1 failure-state accuracy closed:** a non-Git workspace no longer appears
  as a clean Git repository.
- **P1 medium layout closed:** redundant dock chrome and equal row allocation
  no longer halve the usable selected-patch height.
- **P2 compact header closed:** secondary identity no longer forces the project
  title onto two lines while primary actions remain visible.
- **P2 missing coverage closed:** Editor Search now uses the real workspace
  search and preview pipeline.
- **Theme product pass:** multi-file light Editor matches the canonical root,
  sidebar, selection, and diff semantic tokens.
- **P2 missing coverage closed:** wide Editor Chat now shares the authority's
  persisted resize bounds.
- **P1 responsive regression closed:** compact Chat no longer retains a stale
  wide inline width or resize sash.
- **P2 coverage remains:** Web Editor project switching, chat-history tabs,
  terminal rail tabs, and resizable Chat width are not yet implemented in
  Lynx.
- **Harness blocker:** Lynx-for-Web dynamic pointer-to-`bindtap` publication
  still prevents retained click evidence for the Editor/Chat buttons. The
  current-head static host-input probe receives `tap`, but stateful product
  handlers compiled through ReactLynx `updateEvent` do not. Deterministic init
  data proves the rendered states; source/focused tests prove the actions are
  wired.
- **Environment noise:** the isolated machine lacks an executable Codex CLI,
  so `provider.listModels` reports the real provider error. File and thread
  data remain healthy.
- **Native boundary:** the user-owned client remains on `localhost:8901`; no
  exact-owned Native Editor certification is claimed.

## Loss ledger

- `lynx-editor-row-opens-files-dock`: P1 product behavior,
  contribution `1.00 -> 0.00`.
- `lynx-editor-view-missing`: P1 product parity,
  contribution `1.00 -> 0.00`.
- `lynx-editor-changes-mode`: P1 missing coverage,
  contribution `1.00 -> 0.00`.
- `lynx-editor-changes-pre-relay-race`: P1 product reliability,
  contribution `1.00 -> 0.00`.
- `lynx-editor-changes-center-dead-space`: P1 layout usability,
  component contribution `0.245 -> 0.00`.
- `lynx-editor-changes-patch-hidden`: P1 content readability,
  component contribution `1.00 -> 0.00`.
- `lynx-editor-compact-mode-navigation-hidden`: P1 interaction availability,
  component contribution `1.00 -> 0.00`.
- `lynx-editor-compact-file-preview-cramped`: P1 content readability,
  component width loss `0.655 -> 0.00`.
- `editor-compact-web-empty-a11y-snapshot`: harness timing noise,
  contribution `0.00` product loss.
- `lynx-editor-changed-files-sidebar`: P2 missing coverage,
  contribution `0.25 -> 0.00`.
- `lynx-editor-chat-visibility`: P2 missing coverage,
  contribution `0.25 -> 0.00`.
- `lynx-editor-clean-copy-pull-request`: P1 semantic accuracy,
  component contribution `1.00 -> 0.00`.
- `lynx-editor-non-git-shown-clean`: P1 state accuracy,
  component contribution `1.00 -> 0.00`.
- `lynx-editor-medium-patch-compression`: P1 content usability,
  component height loss `0.465 -> 0.00`.
- `lynx-editor-compact-header-identity-wrap`: P2 visual hierarchy,
  contribution `0.25 -> 0.00`.
- `lynx-editor-search-mode`: P2 missing coverage,
  contribution `0.25 -> 0.00`.
- `lynx-editor-project-switching`: P2 missing coverage,
  contribution remains `0.25`.
- `lynx-editor-chat-resize-tabs`: P2 missing coverage,
  contribution remains `0.25` for Chat-history/terminal tabs only.
- `lynx-editor-chat-resize`: P2 missing coverage,
  contribution `0.25 -> 0.00`.
- `lynx-editor-chat-compact-stale-width`: P1 responsive layout,
  contribution `1.00 -> 0.00`.
- `editor-web-boot-splash-capture`: harness loss,
  contribution `0.00` product loss.
- `lynx-web-pointer-to-bindtap`: ReactLynx/Web Core dynamic-event P1 blocker,
  contribution remains `1.00`.
- `native-editor-devtool-fixed-port`: harness blocker,
  contribution `0.00` product loss.

## Compact interaction refresh (2026-08-15)

- Added a new real-interaction cell at `390x844`, DPR 1, dark, using the same
  `.synara-fidelity-editor-changes` snapshot and `58090` relay.
- Trusted pointer input passed:
  - Changes -> Files -> Search -> Changes;
  - Hide chat -> full-height workspace -> Show chat -> original split.
- The rail remained `48x798`. Chat hide expanded the center from
  `342x498.75` to `342x798`, reduced Chat to `0x0`, and restored the initial
  geometry exactly.
- `errors.json` is empty; the only console warning is the known upstream Web
  Core deprecated-initialization warning.
- New-scope accounting:
  - `lynx-editor-compact-rail-interaction`: product pass, component
    contribution `0.00 -> 0.00`;
  - `lynx-editor-compact-chat-toggle-interaction`: product pass, component
    contribution `0.00 -> 0.00`.
- No Native pass is claimed. A fresh equivalent Web authority interaction
  cell remains missing because the isolated authority intermittently failed
  its hydration gate; empty frames and snapshot-mismatched `userdata/` runs
  were rejected as harness losses.
- Evidence:
  `shots/2026-08-15/editor-compact-interactions/notes.md`.
