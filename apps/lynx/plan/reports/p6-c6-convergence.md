# P6-C6 shared-source convergence

Status: completed
Current baseline: 2026-07-30 final convergence audit

## Current honest baseline

| Core screen | Module reuse | LOC reuse | Gate | Distance to 70 |
| --- | ---: | ---: | ---: | ---: |
| Threads | 58.66% | 55.05% | **55.05%** | 14.95pp |
| Threads shell + Sidebar | 67.37% | 63.33% | **63.33%** | 6.67pp |
| Thread | 46.22% | 38.26% | **38.26%** | 31.74pp |
| Settings | 54.34% | 51.19% | **51.19%** | 18.81pp |
| Projects overview | 56.26% | 52.15% | **52.15%** | 17.85pp |
| Project Kanban | 56.26% | 52.15% | **52.15%** | 17.85pp |
| Pull Requests | 61.76% | 57.08% | **57.08%** | 12.92pp |

The target is a report objective under D13, not a release gate. Percentages
must not be raised by unused imports, copied JSX, type-only imports, or wider
EXCLUSIVE declarations.

## Convergence cut 1 — remove diagnostic reachability

The production router statically imported `/ports`, `/ui`, `/markdown`,
`/shared-settings-probe`, and `/fidelity-reference`. The fidelity page was also
reachable through `synara://fidelity-reference`. These were historical
compiler/runtime probes, not any of the six product screens.

The routes, imports, and deep link were removed from the product graph. Source
files remain temporarily for P8-Q1 physical cleanup, but cannot contribute fake
product reuse. Effects:

- Lynx graph: 429 → 420 modules.
- Lynx production: 2211.2 → 2167.8kB.
- Desktop total: 2326.8 → 2283.4kB.
- Settings gate: 51.32% → 51.10%, an intentional honest correction because
  `FidelityReferencePage` had made Settings reference sources product-reachable.
- Other screen gates are unchanged; style remains 98.06%.

Validation: shell runtime 3/3, slice production green, strict reuse/style
write→write→check→check green.

## Convergence cut 2 — one Kanban route header owner

The project board already consumed `KanbanRouteHeaderComposition`, but overview
still owned a parallel `FeatureHeader/Title/Count` renderer and seven obsolete
CSS recipes. Overview now consumes the same shared route header and the local
JSX/CSS owner is deleted.

- Web focused 2 files / 3 tests; slice focused 1 file / 6 tests.
- Web production 8,900 modules; slice 2166.5kB Lynx / 2282.0kB desktop.
- Exact repo-owned DevTool runtime showed the shared 44px header and honest
  offline state with empty error/warning console.
- Projects/Kanban reuse remains 52.07% because the shared header module was
  already reachable through the project route. This demonstrates why P6-C6
cannot use percentage movement as a substitute for deleting the second
source owner.

## Convergence cut 3 — keep diagnostic CSS out of the product graph

Removing diagnostic routes did not remove their selectors from the global
`App.css`, which is imported by the production entry. The probe pages therefore
stopped contributing JSX/modules but still shipped their reference, primitive,
Markdown and port self-test CSS with every product screen.

Diagnostic selectors now live in page-owned `diagnostics.css` and
`FidelityReferencePage.css`; each retained source harness imports its own
stylesheet. Truly dead pre-shared-renderer selectors were deleted from
`App.css`, including the old bubble, feature-empty, read-only-footer and
settings-nav recipes.

- Static class ownership scan: 79 production `App.css` classes, 0 unreferenced
  across slice and canonical Web sources.
- Web focused 2 files / 3 tests; slice focused 2 files / 9 tests.
- Web production: 8,900 modules.
- Slice production: 2159.3kB Lynx / 2274.8kB desktop, another 7.2kB removed
  from each product bundle compared with cut 2.
- Reuse gates are unchanged and style remains 98.06%; moving unreachable
  diagnostics out of global CSS is product-graph hygiene, not reuse credit.
- Strict reuse/style write→write→check→check and both-repo
  `git diff --check` are green.

## Convergence cut 4 — one PR detail tab/capability owner

Web and native both rendered the same Summary/Timeline/Code product taxonomy,
but native still owned a local Summary chip and capability sentence while Web
owned the canonical order and active state. The new physical-shared
`PullRequestDetailTabsComposition` owns the three-tab order, active/available
semantics and unavailable copy. Web consumes it with all tabs available; native
consumes it with only Summary available and a Lynx Elements adapter.

- The old native Summary tab JSX plus tab/capability CSS recipes are deleted.
- Disabled Timeline and Code labels remain visible because the taxonomy is
  ordinary shared product anatomy. They have `aria-disabled="true"`, muted
  styling, guarded tap handlers, and an adjacent explicit
  `Timeline and Code are unavailable in this runtime` disclosure. This does not
  claim the Web-only diff/timeline/review kernels are available.
- Real `pullRequests.list`/detail data selected Synara PR #478 from a 50-entry
  response. Exact DevTool DOM inspection proved the disabled state; tapping
  Timeline left Summary active. Console error/warning output remained empty.
- Web focused **3 files / 6 tests**; slice focused **2 files / 9 tests**; Web
  production **8,902 modules**; slice production **2163.1kB Lynx / 2278.7kB
  desktop total**.
- Static ownership scans: production `App.css` **74 classes / 0 unreferenced**;
  PR tab adapter CSS **8 classes / 0 unreferenced**, across slice and canonical
  Web source.
- Strict audits moved Thread **38.07→38.11%** and Pull Requests
  **56.91→56.97%**; other gates are unchanged and style remains **98.06%**.
  Both repositories pass `git diff --check`.
- Evidence and runtime cleanup are recorded in
  `shots/2026-07-30/port/p6-c6/pr-detail-tabs/notes.md`.

## Convergence cut 5 — one Settings Back/Search chrome owner

Web `SettingsSidebarNav` owned the real Back row and searchable input while
native maintained a local text Back link plus an uncontrolled `<Input>`.
That native input was especially misleading: the same Lynxtron 0.0.7 text
model path has a retained, reproducible `Flutter text model must not be null`
crash. `SettingsSidebarChromeComposition` now physically owns Back → Search
order, labels and the `available | unavailable` capability branch.

- Web consumes the available branch and retains query ranking, Enter top-match,
  Escape clear and real DOM input semantics.
- Native consumes the unavailable branch. Its old Back/Input JSX and
  `BackLink`/`SettingsBack` CSS are deleted; the Lynx Elements adapter renders
  shared Tabler Back/Search icons, `aria-disabled="true"` and explicit
  `Search unavailable in this runtime` copy with no input node.
- Compiler-first showed that the unaliased DOM Elements graph could compile but
  inflated Lynx to **2196.9kB**. The exact Lynx Elements alias produced the
  retained **2170.1kB** product bundle and runtime pixels.
- Exact DevTool inspection measured a 221×28 Back node and 213×28 search
  surface. Back returned to the landing route; search outer HTML contained no
  input/bindtap, and console error/warning output was empty.
- Web focused **3 files / 13 tests**; slice focused **2 files / 8 tests**; Web
  production **8,904 modules**; slice production **2170.1kB Lynx / 2285.6kB
  desktop total**.
- Static ownership scans: production `App.css` **72 classes / 0 unreferenced**;
  Settings chrome adapter CSS **9 / 0**.
- Strict audits remain green. Because Settings is statically reachable through
  the global app shell in both products, the real shared module raises every
  route graph slightly: Threads **55.05%**, Threads shell **63.33%**, Thread
  **38.18%**, Settings **51.19%**, Projects/Kanban **52.15%**, PR **57.05%**.
  Style remains **98.06%** and both repositories pass `git diff --check`.
- Evidence and exact runtime restoration are recorded in
  `shots/2026-07-30/port/p6-c6/settings-sidebar-chrome/notes.md`.

## Convergence cut 6 — one PR detail close owner; delete false identity

Web and native both had a close control, but native also owned a redundant
`PR #<number>` identity row that has no Web dock counterpart.
`PullRequestDetailCloseComposition` now physically owns close visibility and
the canonical accessible label; Web and Lynx retain only host button/icon
Elements. The native-only identity row and both local CSS recipes were deleted.

- Compiler-first with the Web `IconButton`/tooltip host graph built at
  **2388.0kB**. The retained exact alias built at **2170.2kB**, so green compile
  was not treated as adapter proof.
- Real RPC selected PR #478 from a 50-entry response. Exact DevTool inspection
  found one 28×28 close node with
  `aria-label="Close pull request panel"` and zero `PR #478` identity nodes.
  Center tap closed the dock; console error/warning output was empty.
- Web focused **3 files / 6 tests**; slice focused **2 files / 9 tests**; Web
  production **8,906 modules**; slice **2170.2kB Lynx / 2285.8kB desktop**.
- The temporary real project was deleted through canonical RPC and confirmed
  by projection `deleted_at`; all owned processes stopped and user state was
  restored byte-exact.
- Evidence:
  `shots/2026-07-30/port/p6-c6/pr-detail-close/notes.md`.

## Convergence cut 7 — one collapsed-work chrome owner

The native Transcript and Web MessagesTimeline still independently owned the
settled `Worked for` disclosure wrapper, label, chevron, panel and divider.
`CollapsedWorkComposition` now owns the canonical label, trigger → panel →
divider order, accessible expand/collapse label, and controlled open contract.
Web retains Base UI/motion primitives; Lynx retains only tap/visibility
Elements. Native `<list>`, Markdown and work-row rendering remain registered
platform kernels.

- All `TranscriptCollapsedWork*` wrapper/chrome JSX and CSS were deleted.
- Exact DevTool proof measured a 101×18 content node with padded tap box
  x=397–498/y=62–95. Center tap changed panel search count 0→1 and
  `Expand Worked for 6.0s` → `Collapse Worked for 6.0s`; console remained clean.
- Final consolidated gates: Web **4 files / 8 tests**, slice **4 files /
  20 tests**, Web **8,908 modules**, slice **2173.0kB Lynx / 2288.6kB
  desktop**. A broader MessagesTimeline run remained exactly at its registered
  43/48 baseline: the five unrelated status/icon expectation drifts persisted
  and all collapsed-work coverage passed.
- Final serial audits: Threads **55.05%**, Threads shell **63.33%**, Thread
  **38.26%**, Settings **51.19%**, Projects/Kanban **52.15%**, PR **57.08%**;
  style **98.06%** (2,253 classes / 13,185 weighted).
- The temporary in-memory route was removed before final build; owned runtime
  stopped, 8901 released, and KV/window state restored byte-exact.
- Evidence:
  `shots/2026-07-30/port/p6-c6/collapsed-work-chrome/notes.md`.

## Native core-screen JSX/CSS ownership

This is the exhaustive production ownership classification used for the next
source-deletion cuts. “Host” means lifecycle, routing or platform integration;
it is not permission to retain a second copy of ordinary product anatomy.

| Core surface | Native production owner | Physical-shared anatomy already consumed | Retained host / platform kernel | Remaining ordinary candidate |
| --- | --- | --- | --- | --- |
| App shell + Sidebar | `router.tsx`, `Sidebar.lynx.tsx` and sidebar adapters | App frame, desktop header, segmented/primary surfaces, projects/chats/pinned/studio sections, rows, meta/status, footer and search palette | Memory routing, snapshot/KV projection, `<scroll-view>`, disclosure/scroll controllers and leaf host/asset glyph Elements | No second ordinary anatomy owner identified; interaction states belong to P7 |
| Threads landing | `router.tsx` | Chat surface header, centered empty landing, composer frame/placeholder | Route restore/query lifecycle and host scroll wrapper | No second page anatomy owner identified |
| Thread | `router.tsx`, `Transcript.lynx.tsx`, `Composer.lynx.tsx` | Header/empty/panel state, message and status rows, collapsed-work disclosure chrome, typography, composer shell/editor/footer and menus | `<list>` virtualization/stick controller, native Markdown, textarea/input, disclosure event/visibility Elements and polling bridge | No second ordinary anatomy owner identified |
| Settings | `SettingsPage.tsx` plus settings adapters | Back/Search capability chrome, navigation taxonomy, panel header, General, Appearance and theme-pack editor | Storage/server hydration, two-pane scroll, clipboard and registered crashing native text-input kernel | No second page anatomy owner identified; unavailable search now avoids that kernel |
| Projects + Kanban | `FeatureListsPage.tsx` plus Kanban adapters | Route header, overview, canonical board projection, columns and cards | Query/memory route, `<scroll-view>`, read-only capability; DnD is Web-only kernel | No second page anatomy owner identified |
| Pull Requests | `FeatureListsPage.tsx` plus PR adapters | Route header/filters, list/row/states, Summary, canonical tabs/capability and close control | Query/mutation, 50% dock, scroll and close icon/button Elements; Timeline/Code/review kernels remain Web-only | No second ordinary anatomy owner identified; redundant native identity was deleted |
| Cross-screen controllers | `router.tsx`, `Composer.lynx.tsx` | Shared projection/composition modules listed above | Background snapshot/RPC, native window/route/scroll/input lifecycle | Split large controllers only when it deletes a visible second owner |

## Why the remaining gap is not one duplicate page

The generated baseline JSON remains the exhaustive per-module authority. The
largest eligible-but-unreused modules fall into these architectural groups:

| Group | Representative modules | Explanation / next treatment |
| --- | --- | --- |
| Web route and app orchestration | `routes/__root.tsx`, `_chat.tsx`, route-owned PR/Settings files | Owns TanStack browser routing, desktop gutters, lazy panes and Web stores. Share cohesive state/anatomy below it; do not import the route shell into Lynx memory-history. |
| Mature Web monoliths already split below | `Sidebar.tsx` (6052 LOC), `ChatView.tsx` (10691 LOC), `MessagesTimeline.tsx` (2720 LOC) | Core visible anatomy is already consumed through shared compositions. Remaining LOC mixes DOM/Router/store/terminal/diff kernels; importing the monolith would reintroduce the failures documented in P-30/P-32. Continue extracting cohesive product-owned composition/state, not opaque slots. |
| Registered hard platform kernels that remain eligible | terminal state/layout, `DiffPanel`, PR Code/Timeline/review actions, Lexical and DnD call sites | They remain in the denominator unless narrowly approved EXCLUSIVE; D13 explicitly forbids expanding exclusions to meet 70. Their gap is reported, not hidden. |
| Product features outside the completed native capability slice | Automations, provider/MCP Settings panels, What’s New, space/project creation | Navigation/capability is honest, but full feature trees are not yet native product consumers. Phase 7/8 determines interaction coverage; P6-C6 only removes duplicated core-screen renderers. |
| Native route/state wrappers and leaf Elements | memory-history, background RPC/query, `<list>`/scroll, native Markdown/input, close/glyph host adapters | These are retained platform lifecycle or primitive mappings, not second page anatomy. P7 audits their interaction states; P8 removes diagnostics and staging residue. |

## Final below-70 disposition

Every core screen remains below the reporting target, but the remaining gap is
classified without widening EXCLUSIVE:

- **Threads / Threads shell:** Web route/store orchestration, terminal/browser
  entry kernels and DOM interaction layers remain eligible. Visible shell and
  sidebar anatomy are physical-shared; native memory history, snapshot/KV,
  scroll and glyph Elements are platform adapters.
- **Thread:** the Web `ChatView`/`MessagesTimeline` monoliths include DOM list,
  selection, diff/tool actions, terminal and browser-only interactions. Message
  rows, status, collapsed-work chrome, transcript typography and composer
  anatomy are shared; native `<list>`, Markdown, textarea, polling and
  disclosure event/visibility are registered kernels.
- **Settings:** Web route orchestration plus unsupported provider/MCP,
  notification and integration panels remain eligible. Navigation, chrome,
  General, Appearance and theme-pack editor anatomy are shared; native search
  is honestly unavailable because of the registered text-model crash.
- **Projects/Kanban:** Web DnD, optimistic mutation, draft/terminal state and
  route orchestration remain eligible. Overview/header/board/columns/cards are
  shared; native is explicitly read-only.
- **Pull Requests:** Web Timeline/Code/diff/review/merge/search kernels and
  route orchestration remain eligible. List/row/states/filters/Summary/tabs/
  capability/close anatomy are shared; native is honestly read-only.

No diagnostic reachability, unused import, type-only credit, copied JSX or
expanded EXCLUSIVE classification is used to improve these values.

## Exit checklist

- [x] Remove historical diagnostic pages from the production import graph.
- [x] Remove the Kanban overview-only route header renderer/styles.
- [x] Remove historical diagnostic and superseded renderer CSS from the
  production stylesheet graph.
- [x] Enumerate all remaining native core-screen JSX/CSS ownership.
- [x] Share or delete ordinary duplicate anatomy; retain only documented host
  Elements, `<list>`, Markdown, text-input, DnD, terminal/browser/PDF and other
  real kernels.
- [x] Regenerate the exhaustive six-screen gap report after convergence.
- [x] Explain every remaining below-70 group without widening EXCLUSIVE.
- [x] Run final two-repo tests/build/audits/diff checks and update roadmap/LOG.
