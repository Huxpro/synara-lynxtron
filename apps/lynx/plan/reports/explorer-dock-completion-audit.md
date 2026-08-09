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
| File icon identity | Lynx consumes Web's canonical `getFileIconName` and shared color resolver, renders the exact Central SVG family for every mapped type, and falls back to `code-brackets` only for unknown types | PASS |
| Image preview | Workspace-relative allowlisted images bypass the text RPC, resolve through the shared authenticated `/api/local-image` route, and render in an `aspectFit` preview surface with filename metadata | PASS |
| PDF fallback | Workspace-relative PDFs bypass text decoding, resolve through the same allowlisted local-preview URL builder, and expose a real `system-default` action with a traversal-safe absolute target. The surface explicitly states that Native in-app page rendering is unavailable | PASS |
| Live Explorer light/dark populated matrix | At `1280×820`, DPR 1, both themes render three entries, selected `README.md`, a `512×774` dock, `240px` sidebar, `239×685` entries scroll area, `271×730` preview, and `247×706` preview scroller. Light resolves the dock to `rgb(255,255,255)` / `rgb(13,13,13)`; dark resolves to `rgb(16,16,16)` / `rgb(252,252,252)`. Both PNGs are exactly `1280×820` | PASS |
| Narrow Explorer geometry | At `900×700`, DPR 1, the dock clamps to `580px` (`900 - 320px` minimum main content), keeps a `240px` sidebar and `339px` preview, restores matching `padding-right:580px`, preserves the selected README preview, and exports an exact `900×700` PNG | PASS |
| Explorer drag resizing | At `1280×820`, the Web-compatible sash path changed the dock from `640px` to `760px` through a trusted pointer drag. The target width survived the page refresh and `ThreadPage` restored matching `padding-right:760px`; Native retains the shared `createLynxSidebarResizeSession` path | PASS |
| Retained evidence | `shots/2026-08-09/explorer-populated-current/` records light/dark/narrow PNGs, geometry and relay JSON, bundle hashes, provenance, known provider-path limitation, and byte/process cleanup | PASS |
| Native DOM/screenshot tooling | Current Lynx SDK returns `{}` for `DOM.getDocument` and no DevTool screencast frame; CoreGraphics confirms the owned 1280×820 window but cannot replace exact LynxView capture | RECORDED LIMIT |

## Scope boundary

- This is the first real Explorer slice, not full Web Explorer parity.
- The Lynx-for-Web activation blocker is resolved for trusted click and Enter.
- Native in-app PDF page rendering, file references, ask-why, comments, and
  syntax-highlighted rich preview remain future product scope rather than
  blockers for this first Explorer slice. PDF files now have a safe,
  non-deceptive default-app fallback; that is not claimed as Web PDF viewer
  parity.

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

## File-icon continuation

`shots/2026-08-09/explorer-file-icons-current/` replaces the `▤` text
placeholder with the same Central icon identity and extension colors used by
Web. The pure icon-name and color tables now have one owner in
`apps/web/src/file-icons.ts`; Web keeps its Tailwind utility classes while Lynx
embeds the matching static SVG and resolves theme-semantic colors through the
existing Lynx palette.

The retained fixture proves JSON `#f5c542`, TypeScript `#3178c6`, unknown Go
fallback `#9ca3af`, Markdown `#6cb6ff`, and PDF `#ef4444` at the unchanged
28px row rhythm in both light and dark. The full static Central mapping adds
about 118KB to the uncompressed Lynx bundle; that explicit cost avoids silently
misrepresenting known Python, image, archive, document, media, and framework
files as generic code.

## Image-preview continuation

`shots/2026-08-09/explorer-image-preview-current/` closes workspace-relative
image preview without introducing a new filesystem bypass. Lynx reuses the
shared image extension allowlist and server `/api/local-image` route, derives
the HTTP origin from the active runtime WebSocket endpoint, and skips
`projects.readFile` for binary images.

The retained 32x24 fixture is half red and half blue. Both light and dark
1280x820 frames contain 51,324 exact pixels of each color in the preview
surface; the route returns HTTP 200, `image/png`, trusted-origin CORS, and 142
bytes. Relay evidence contains no `projects.readFile`.

## PDF-fallback continuation

Workspace-relative PDFs now use the shared preview-file allowlist rather than
entering `projects.readFile`, so binary bytes are never decoded as source text.
The Lynx surface renders the canonical PDF icon, file name, explicit capability
copy, and one `Open in default app` action. That action joins only a safe
workspace-relative path and sends the resulting absolute path through the
existing authenticated `shell.openInEditor` RPC with `system-default`.

This does not render PDF pages inside Lynx. The current Lynxtron runtime has no
working `<webview>` fallback, and the Web viewer depends on pdf.js canvas,
selectable text/link layers, page navigation, and zoom controls. The fallback
therefore names the boundary instead of presenting an image, iframe, or
synthetic page controls as Native PDF parity.
