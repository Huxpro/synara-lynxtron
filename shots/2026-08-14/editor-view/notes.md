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
- **P2 coverage remains:** Web Editor Search mode, project switching, editor
  changed-files sidebar and selection, chat-history tabs, terminal rail tabs,
  and resizable Chat width are not yet implemented in Lynx.
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
  contribution remains `0.25`.
- `lynx-editor-search-mode`: P2 missing coverage,
  contribution remains `0.25`.
- `lynx-editor-chat-resize-tabs`: P2 missing coverage,
  contribution remains `0.25`.
- `editor-web-boot-splash-capture`: harness loss,
  contribution `0.00` product loss.
- `lynx-web-pointer-to-bindtap`: ReactLynx/Web Core dynamic-event P1 blocker,
  contribution remains `1.00`.
- `native-editor-devtool-fixed-port`: harness blocker,
  contribution `0.00` product loss.
