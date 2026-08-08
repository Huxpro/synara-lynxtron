# Explorer Dock completion audit

Status: implementation, contracts, production builds, real project RPCs, and
thread bootstrap hydration pass. Live light/dark interaction certification is
still blocked by the Lynx-for-Web activation bridge and is not claimed.

## Prompt-to-artifact checklist

| Requirement | Artifact / evidence | Result |
| --- | --- | --- |
| Use a real host capability instead of a fake Browser Dock | Lynxtron has no BrowserView/WebContentsView bridge; Explorer uses `projects.listDirectories`, `projects.searchEntries`, and `projects.readFile` | PASS |
| Reuse the monorepo Explorer anatomy | `ExplorerDock.lynx.tsx` follows Web `DockExplorerPane`: fixed 240px explorer column plus a flexible file preview | PASS |
| Reuse right-panel resizing | Explorer consumes `ResizableRightPanel` with 480–960px bounds and preserves at least 320px for the transcript | PASS |
| Keep Diff and Explorer predictable | `router.tsx` makes the two right docks mutually exclusive and synchronizes ThreadPage padding through `rightDockWidth` | PASS |
| Root listing | Canonical fixture RPC returned `directory:docs`, `directory:src`, and `file:README.md` | PASS |
| File-name search | Canonical fixture RPC returned `src/explorer-fixture.ts` for `explorer-fixture` | PASS |
| File preview | Canonical fixture RPC read `README.md`, returned the expected heading, and was not truncated | PASS |
| Markdown and text rendering | Markdown uses the existing Lynx `ChatMarkdown`; other files use the mono text preview and expose the 1 MB truncation state | PASS |
| Main/background thread boundary | Explorer dynamically imports the background-only transport from background-only query loaders; the Native build rejects regressions here | PASS |
| Light and dark source theming | Explorer has no literal colors or color mixing. It uses only `ThemeState → SliceRoot--theme-*` semantic tokens for background, text, borders, selection, error, and hover states | PASS |
| Light and dark geometry | Both themes share the same component tree and 50% / 480–960 / 240px geometry contract | PASS at source/contract level |
| Focused tests | Explorer, shared right-panel, and Environment/right-dock contracts pass 8/8 | PASS |
| Production builds | Native/Desktop, Lynx-for-Web, and Web original production builds pass | PASS |
| Native identity and console | Exact-owned PID `94395`, client `localhost:8903`, App `@synara/lynx`, session URL points at `apps/lynx/dist/desktop/main.lynx.bundle`; error/warning console is empty | PASS |
| Native bundle identity | Staged and output bundle hashes match: `89e44c076dd06131f019143f4a7083164473dfbf4aa589be1cec087288a72598` | PASS |
| Thread bootstrap hydration | Host route is supplied through Lynx `initData`; App prefetches the initial thread before leaving the hydration shell; canonical fixture rendered its real title, workspace, empty state, and enabled Files control | PASS |
| Live Explorer light/dark matrix | The rendered Files control receives Web hover/focus state, but trusted mouse click and keyboard Enter do not reach its Lynx `bindtap`/`bindkeydown` handler | BLOCKED — no interaction or pixel-pass claim |
| Native DOM/screenshot tooling | Current Lynx SDK returns `{}` for `DOM.getDocument` and no DevTool screencast frame; CoreGraphics confirms the owned 1280×820 window but cannot replace exact LynxView capture | RECORDED LIMIT |

## Scope boundary

- This is the first real Explorer slice, not full Web Explorer parity.
- Directory expansion, image/PDF preview, file references, ask-why, comments,
  and syntax-highlighted rich preview remain future work.
- The Lynx-for-Web activation bridge must be resolved before retaining Explorer
  light/dark interaction screenshots or claiming pixel parity.
