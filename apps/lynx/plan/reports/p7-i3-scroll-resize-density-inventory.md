# P7-I3 scroll / resize / density inventory

Status: completed · 2026-07-31

## Product contract

P7-I3 closes three runtime behaviors on the six production routes:

1. transcript, sidebar, and Kanban content remain independently scrollable;
2. the shell reflows at 1280×820 and 1440×900 without page-level overflow or
   horizontal displacement;
3. the canonical UI-density setting changes the running Native application,
   with at least compact and comfortable/default proven in product.

The source Web application remains the behavior reference. A fulfilled
programmatic scroll command, persisted window bounds, or a selected density
control does not by itself prove the corresponding product behavior.

## Current product inventory

| Surface | Web authority | Native product path | Current evidence / gap |
|---|---|---|---|
| Transcript | `MessagesTimeline` owns a `LegendList`; `ChatView` clears live-output follow on pointer/touch/wheel input, reads `isAtEnd`, debounces the bottom button, and only resticks for real transcript messages | `Transcript` owns a vertical `<list>`, follows appended row/version changes while pinned, accepts user-source scroll geometry, and exposes `Jump to latest` | **Current product proven.** Real macOS wheel input on routed `Reply MODEL-READY` detached the list and exposed `Jump to latest ↓`; real click returned to the tail and removed the Jump host. Both frames were captured with an empty error/warning console. DevTool injection/programmatic scroll remain explicitly non-evidence |
| Sidebar | Web `SidebarContent` uses the canonical `ScrollArea` with a `min-h-0 flex-1` viewport | shared `SidebarSurfaceContent` maps to one vertical `scroll-view`; titlebar remains outside it | **Proven.** With 5 projects × 16 real RPC-created threads, real pointer drag exposed lower projects/Chats while the native titlebar and Settings footer remained fixed |
| Kanban overview | shared overview composition maps to a horizontal, dynamically sized project strip; each project card list scrolls vertically | exact shared composition maps to one horizontal `scroll-view` plus per-project vertical `scroll-view`s | **Proven.** Real horizontal drag moved Project 01/02/03 → 02/03/04 without moving shell/sidebar. Real wheel changed only Project 01 from `16…07` to `10…01`; Project 02 and outer strip remained fixed |
| Kanban project | Web uses three columns with per-column vertical overflow; Web can horizontally overflow at narrower widths | Native deliberately follows P-18: known three-column desktop board is a normal equal-width flex row with vertical column scrollers, avoiding the Lynx horizontal-scroll shell displacement bug | **Proven.** Draft/In Progress/Done remained simultaneously visible at both certification sizes; real Draft drag changed only its rows while header and sibling columns remained fixed |
| Window resize | Web layout uses `min-h-0` / `min-w-0` containment and content-owned overflow | Lynx window enforces 900×650 minimum and persists move/resize/maximize/fullscreen bounds after 150 ms; product shell is a 256 px fixed sidebar plus a `min-width:0` main surface | **Proven.** Exact 1280×820 and 1440×900 window states produced 1280×788 and 1440×868 content roots plus the 32 px native titlebar. The 1440 Sidebar border measured 255 px; no shell displacement or page-level overflow |
| UI density | `useAppDensity` reads canonical settings and applies variables from physical-shared `lib/appDensity.ts` to the Web root | `App` hydrates the same canonical projection, switches `SliceRoot--density-*` immediately, and Settings change/restore feeds the root callback; class-scoped variables use platform-equivalent px while retaining canonical taxonomy/normalization | **First cut complete.** comfortable→compact changed the live routed product, compact survived restart, and the product was returned live to comfortable. Final geometry was 23.8px compact versus 28px comfortable for the same primary-action row; console clean |

## Boundaries

- Keep `<list>`, `scroll-view`, `LegendList`, DOM `ScrollArea`, and window
  persistence as platform kernels.
- Share threshold/density math and product state. Do not count a probe-only
  import or a selected Settings segment as runtime density support.
- The fixed three-column Native Kanban exception remains the proven P-18
  boundary; the dynamic overview remains horizontally scrollable.
- Native density may use static class-scoped custom properties because
  Lynxtron 0.0.7 does not reliably apply runtime custom-property mutations.
  The values and normalization still come from the canonical Web density
  contract.

## Planned verification cuts

1. ✅ Hydrate the Native root from canonical `uiDensity`, update it immediately
   from Settings, and map the shared density variables through stable root
   classes.
2. ✅ Prove comfortable→compact→comfortable on the running product without a
   restart, then restart once to prove persistence.
3. ✅ Re-run real pointer transcript detach→Jump→restick on the current product.
4. ✅ Exercise overflowing sidebar and Kanban containers, then capture
   1280×820 and 1440×900 layout evidence.
5. ✅ First-cut gates: Web focused 3/3, slice focused 7/7, Web production
   8,909 modules, slice 2223.2kB Lynx / 2340.1kB desktop, strict serial audits
   and both repositories' diff checks passed. Repeat the same gate after the
   remaining overflow/resize cut before completing P7-I3.

## Completion gate

The final overflow/resize cut passed Web 9/9 and Slice 16/16 focused tests,
Web production at 8,909 modules, Slice production at 2223.2 kB Lynx /
2340.1 kB desktop, the exact serial audit sequence, and both repositories'
`git diff --check`. Runtime evidence and cleanup are recorded in
`shots/2026-07-30/port/p7-i3/overflow/notes.md`.
