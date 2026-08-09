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
| Markdown and text rendering | Markdown uses the existing Lynx `ChatMarkdown`; supported source files use Host-owned Shiki tokens with line numbers, while unsupported/failed/oversized files preserve the immediate mono fallback and 1 MB truncation state | PASS |
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
| Chat file references | Structured file mentions, local Markdown links, and file-shaped inline code resolve to traversal-safe workspace-relative targets and open the existing Explorer selected-path owner. User-message fallback rendering preserves mention chips while the async Markdown parser initializes | PASS |
| Whole-file chat actions | The Explorer preview header matches Web's 40px file chrome and exposes `Reference in chat` / `Ask why this changed`. Both actions reuse Web formatting, append to the active Lynx composer draft, and preserve structured mention metadata | PASS |
| Source line comments | Every highlighted source line exposes an accessible `Comment on line N` gutter control. The inline editor reuses Web's copy, normalization, length limit, Cancel/Comment semantics, shared composer comment chip, persistence, and `<file_comments>` send serialization | PASS |
| Live Explorer light/dark populated matrix | At `1280×820`, DPR 1, both themes render three entries, selected `README.md`, a `512×774` dock, `240px` sidebar, `239×685` entries scroll area, `271×730` preview, and `247×706` preview scroller. Light resolves the dock to `rgb(255,255,255)` / `rgb(13,13,13)`; dark resolves to `rgb(16,16,16)` / `rgb(252,252,252)`. Both PNGs are exactly `1280×820` | PASS |
| Narrow Explorer geometry | At `900×700`, DPR 1, the dock clamps to `580px` (`900 - 320px` minimum main content), keeps a `240px` sidebar and `339px` preview, restores matching `padding-right:580px`, preserves the selected README preview, and exports an exact `900×700` PNG | PASS |
| Explorer drag resizing | At `1280×820`, the Web-compatible sash path changed the dock from `640px` to `760px` through a trusted pointer drag. The target width survived the page refresh and `ThreadPage` restored matching `padding-right:760px`; Native retains the shared `createLynxSidebarResizeSession` path | PASS |
| Retained evidence | `shots/2026-08-09/explorer-populated-current/` records light/dark/narrow PNGs, geometry and relay JSON, bundle hashes, provenance, known provider-path limitation, and byte/process cleanup | PASS |
| Native DOM/screenshot tooling | Current Lynx SDK returns `{}` for `DOM.getDocument` and no DevTool screencast frame; CoreGraphics confirms the owned 1280×820 window but cannot replace exact LynxView capture | RECORDED LIMIT |

## Scope boundary

- This is the first real Explorer slice, not full Web Explorer parity.
- The Lynx-for-Web activation blocker is resolved for trusted click and Enter.
- Native in-app PDF page rendering remains future product scope rather than a
  blocker for this first Explorer slice. PDF files now have a safe,
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

## File-reference continuation

Lynx now follows Web's file-reference behavior for structured user mentions,
local Markdown links, and file-shaped inline code. The Web inline-code
candidate grammar has one shared owner; Lynx resolves candidates through Web's
Markdown-link parser, strips line/column suffixes for preview, and rejects
external, traversal, and out-of-workspace targets before calling the Explorer
owner.

`ThreadPage` clears Explorer search, selects the safe relative path, closes
competing right-side surfaces, and opens the existing Explorer dock. Markdown
rendered inside Explorer uses the same callback, so linked workspace files do
not fall back to an external app or a second viewer implementation.

The user-message fallback now preserves structured composer chips before the
async Markdown parser completes instead of flashing raw `@path` text. Native
keeps the original `bindtap` path. Lynx-for-Web reuses the existing audited
host navigation target because its custom text element does not publish normal
clicks; the compatibility bridge adds click, keyboard, and 2px pointer-threshold
coverage without injecting product state.

## Preview-action continuation

Every selected Explorer file now gets the same 40px header rhythm as Web's
shared file preview: the path occupies the flexible left region and a 28px
`More actions` trigger owns the right edge. The menu keeps Web's action order
and exact copy: `Reference in chat`, then `Ask why this changed`.

Both actions write through the existing Lynx composer draft store. Formatting
comes from the same pure Web helpers, while the Lynx adapter adds the matching
structured file mention before setting the prompt so draft filtering cannot
discard it. Existing prompt text is separated correctly and repeated file
mentions are deduplicated.

Lynx-for-Web uses the established idempotent init-target pattern only for
opening and positioning the menu because its SVG/text custom elements do not
publish the trigger tap or native anchor measurement. Once visible, menu items
remain the real Lynx Menu controls and were activated through their accessible
`menuitem` refs. Native keeps the unmodified Menu trigger/item path.

## Syntax-preview continuation

`shots/2026-08-10/explorer-syntax-current/` closes the rich source-preview
gap without introducing an HTML renderer or regex-based pseudo-highlighting.
The Desktop/Web Host owns a real Shiki JavaScript-regex highlighter and returns
bounded token JSON; the Lynx UI reconstructs the exact source with line numbers
and token color/font-style metadata.

The Host loads only 34 explicit language modules plus `github-light` and
`github-dark`. This reduced the Web production directory from the initial
full-registry prototype's roughly 40 MB to roughly 11 MB. Both themes are
tokenized in one Host request, so theme changes select a matching cached token
projection without a second filesystem read or a light/dark race.

The canonical RPC fixture proves TypeScript highlighting through the real
`projects.readFile` path. At `1280x820`, light resolves `export` to `#D73A49`
and `syntaxReady` to `#005CC5`; dark resolves them to `#F97583` and `#79B8FF`.
Both frames expose six line numbers, preserve the source, have empty page-error
logs, and use one Host tokenization request.

The final Native production bundle cold-started in the exact-owned Synara
Lynxtron process, opened the real thread route, connected to the isolated
server, and listed the canonical workspace. Native token pixels remain
uncertified: the background-owned window cannot open the nested source file
through the current input harness, and the owned PID did not expose a DevTool
listener. Other clients on ports 8901/8904 belonged to different PIDs and were
explicitly rejected rather than reused.

## Line-comment continuation

`shots/2026-08-10/explorer-comments-current/` closes the actionable source
comment gap without claiming DOM range selection. Each syntax line owns an
accessible 34px gutter control. Activating `Comment on line 1` opens the same
`Local comment` / `Comment on line 1` / `Request change` / Cancel / Comment
anatomy as Web directly below the active line, with a semantic accent band.

The implementation reuses `apps/web/src/lib/fileComments.ts` as the only
normalization, range-label, 4,000-character, deduplication, and prompt-block
owner. Valid comments persist in the Lynx composer draft, render through the
shared `ComposerReferenceAttachmentsComposition`, can be cleared as a group,
and serialize through the exact Web `<file_comments>` block before dispatch.
They are not converted into a guessed wire attachment or inserted into the
visible prompt text.

The retained light/dark frames are both `1280x820`, have identical
`440x135 @ (807,164)` editor geometry, six named line controls, the active
line-5 band, current TypeScript tokens, and empty page-error logs. A real mouse
click reached the line gutter and the existing Web-only compatibility layer
represented the idempotent `explorerCommentLine=5` init target; Native keeps
the original `bindtap` path.

Focused verification covers the rendered line tap/Cancel path, editable
comment submit behavior, invalid input, normalization, persistence,
deduplication, removal, shared chip wiring, and exact send serialization
(`47/47`). Web and Desktop production builds pass. Web Elements still does not
publish real `x-textarea` keyboard input back through ReactLynx `bindinput`, so
runtime text entry is not claimed from Browser automation; Native textarea/IME
remains the certification boundary already recorded by the theme-import audit.
