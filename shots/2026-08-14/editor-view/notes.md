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
- **P2 coverage remains:** Web Editor Search mode, project switching, editor
  chat-history tabs, terminal rail tabs, and resizable Chat width are not yet
  implemented in Lynx.
- **Harness blocker:** Lynx-for-Web pointer-to-`bindtap` publication still
  prevents retained click evidence for the Editor/Chat buttons. Deterministic
  init data proves the rendered state; source/focused tests prove both actions
  are wired.
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
- `lynx-editor-search-mode`: P2 missing coverage,
  contribution remains `0.25`.
- `lynx-editor-chat-resize-tabs`: P2 missing coverage,
  contribution remains `0.25`.
- `editor-web-boot-splash-capture`: harness loss,
  contribution `0.00` product loss.
- `lynx-web-pointer-to-bindtap`: upstream Web Core P1 blocker,
  contribution remains `1.00`.
- `native-editor-devtool-fixed-port`: harness blocker,
  contribution `0.00` product loss.
