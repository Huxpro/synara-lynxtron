# Explorer Dock completion audit

Status: implementation, contracts, production builds, real project RPCs,
thread bootstrap hydration, activation, populated Explorer rendering, search,
file preview, responsive layout, and light/dark Lynx-for-Web evidence pass.

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
| Focused tests | Explorer, shared right-panel, thread bootstrap, Web interaction, and shared interactive-state contracts pass 24/24 | PASS |
| Production builds | Native/Desktop, Lynx-for-Web, and Web original production builds pass | PASS |
| Native identity and console | Exact-owned PID `94395`, client `localhost:8903`, App `@synara/lynx`, session URL points at `apps/lynx/dist/desktop/main.lynx.bundle`; error/warning console is empty | PASS |
| Native bundle identity | Staged and output bundle hashes match: `5f51fb164bf90f15a79d3ed46d62434ea58396118bacfe47010b721c5e1855d8` | PASS |
| Thread bootstrap hydration | Host route is supplied through Lynx `initData`; App prefetches the initial thread before leaving the hydration shell; canonical fixture rendered its real title, workspace, empty state, and enabled Files control | PASS |
| Live Explorer activation | Trusted mouse click closes and opens the dock; focused keyboard Enter opens it. The Web-only compatibility path writes an idempotent `explorer=open\|closed` target to the harness URL and reloads the Lynx page, while Native keeps the original `bindtap`/`bindkeydown` path | PASS |
| Live Explorer populated data | Canonical fixture rendered `docs`, `src`, and `README.md`; relay diagnostics included `projects.listDirectories`. Trusted README selection included `projects.readFile` and rendered the expected Markdown. Search `populated` + Enter included `projects.searchEntries`, returned only `src/populated.ts`, and its trusted selection rendered the source text | PASS |
| Directory expansion | Canonical nested fixture expanded `src` then `src/nested` through real rendered mouse input, issued one lazy `projects.listDirectories` request per level, rendered `tree.ts` and `deep.ts`, and collapsed the parent without exposing descendants | PASS |
| Tree row fidelity | Tree rows now match Web's 28px single-line anatomy, use the shared disclosure chevron motion, and indent root/child/grandchild content at 8/22/36px instead of duplicating names as `docsdocs` / `srcsrc` | PASS |
| Live Explorer light/dark populated matrix | At `1280×820`, DPR 1, both themes render three entries, selected `README.md`, a `512×774` dock, `240px` sidebar, `239×685` entries scroll area, `271×730` preview, and `247×706` preview scroller. Light resolves the dock to `rgb(255,255,255)` / `rgb(13,13,13)`; dark resolves to `rgb(16,16,16)` / `rgb(252,252,252)`. Both PNGs are exactly `1280×820` | PASS |
| Narrow Explorer geometry | At `900×700`, DPR 1, the dock clamps to `580px` (`900 - 320px` minimum main content), keeps a `240px` sidebar and `339px` preview, restores matching `padding-right:580px`, preserves the selected README preview, and exports an exact `900×700` PNG | PASS |
| Explorer drag resizing | At `1280×820`, the Web-compatible sash path changed the dock from `640px` to `760px` through a trusted pointer drag. The target width survived the page refresh and `ThreadPage` restored matching `padding-right:760px`; Native retains the shared `createLynxSidebarResizeSession` path | PASS |
| Retained evidence | `shots/2026-08-09/explorer-populated-current/` records light/dark/narrow PNGs, geometry and relay JSON, bundle hashes, provenance, known provider-path limitation, and byte/process cleanup | PASS |
| Native DOM/screenshot tooling | Current Lynx SDK returns `{}` for `DOM.getDocument` and no DevTool screencast frame; CoreGraphics confirms the owned 1280×820 window but cannot replace exact LynxView capture | RECORDED LIMIT |

## Scope boundary

- This is the first real Explorer slice, not full Web Explorer parity.
- The Lynx-for-Web activation blocker is resolved for trusted click and Enter.
- Image/PDF preview, file references, ask-why, comments,
  and syntax-highlighted rich preview remain future product scope rather than
  blockers for this first Explorer slice.

## Directory-tree continuation

`shots/2026-08-09/explorer-directory-tree-current/` closes the directory
expansion gap with a two-level real fixture. Lynx owns the same expanded-path
set as Web, lazy-loads each visible directory through the existing typed
`projects.listDirectories` RPC, caches successful results for 30 seconds, and
evicts failed requests so retry remains possible. Search results remain flat.

The Web-only host compatibility layer represents expanded targets with repeated
`explorerExpanded` URL parameters because Web Elements does not publish the
ReactLynx `bindtap`; the Desktop bundle retains the original live `bindtap`
state path. Light and dark `1280x820` evidence has identical 28px row geometry,
8/22/36px indentation, empty page-error files, and three directory-list RPCs.
