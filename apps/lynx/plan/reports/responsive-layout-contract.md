# Responsive layout contract

## Capability findings

- Lynx documents `onWindowResize(width, height)` for page-size changes on
  Desktop/Clay 3.5+. `SystemInfo.pixelWidth/pixelHeight` are physical display
  metrics, not the application viewport, so they are not valid breakpoint
  inputs.
- Lynxtron owns the native content rectangle through
  `LynxWindow.getContentBounds()` / `setContentSize()`. Synara now hydrates from
  content bounds and publishes every host resize through `viewport:resize`,
  while also listening to the canonical Lynx `onWindowResize` event.
- Native RSpeedy output does not retain the existing Settings `@media
  (max-width: 640px)` rule, and the Lynx environment intentionally has no
  `matchMedia`. Native responsive behavior therefore uses user-space viewport
  state projected to stable root classes, not browser CSS media queries.

## Shared API

- `apps/web/src/responsiveLayout.logic.ts` owns the breakpoint values already
  used by Web: `sm=640`, `md=768`, `lg=1024`, `xl=1280`, `2xl=1536`,
  `3xl=1600`, `4xl=2000`.
- `resolveViewportLayout()` maps a measured viewport to:
  - `compact`: width below 768;
  - `medium`: 768 through 1023;
  - `wide`: 1024 and above;
  - `unknown`: no trustworthy measurement yet.
- Web `useMediaQuery` consumes the shared constants. Web
  `useViewportLayout()` subscribes to browser resize. Lynx
  `useViewportLayout()` hydrates from native content bounds and subscribes to
  both resize event sources.
- Lynx projects the result as
  `SliceRoot--viewport-{unknown|compact|medium|wide}` plus numeric
  `data-viewport-width/height`, giving CSS and DevTool one auditable contract.

## Layout ownership

### Fixed

- Desktop thread/Settings sidebar: 256px while open.
- Desktop titlebar/drag row: 46px.
- Titlebar navigation controls and row-level icon/control affordances retain
  their measured fixed geometry.

### Flexible with caps

- `AppMain` owns all remaining horizontal space through `flex: 1` and
  `min-width: 0`.
- Composer/transcript column: fluid container width with a 736px maximum and
  12px side clearance.
- Empty-thread context tray: fluid container width with the same 736px maximum
  and 12px side clearance.
- Settings content remains a flexible scroll viewport with 672px/768px content
  caps.

### Scroll owners

- Sidebar list: `.AppSidebarScroll`, independent of main content height.
- Transcript: native transcript list/scroll owner.
- Settings: `.SettingsContent`.
- Pull Requests: list scroller and detail scroller remain separate.
- Kanban: route scroller plus per-column vertical scroll owners.

Resize must change each viewport's available dimensions; it must not move
scroll ownership to the outer window or introduce whole-window horizontal
scroll.

## Current verified slice

Exact-owned Native production evidence:

| Window | Band | Sidebar | Sidebar scroll | Main | Composer |
| --- | --- | ---: | ---: | ---: | ---: |
| 900x650 | medium | 256 | 560 high | 644 | 620 |
| 1024x700 | wide | 256 | independent | 768 | 736 |
| 1440x900 | wide | 256 | 810 high | 1184 | 736 |

The 900px run started from a previously persisted 1280px window and changed to
900px after renderer readiness. The root changed from `wide/1280` to
`medium/900`, proving the live host resize -> event -> hook -> class path rather
than only cold-start classification. All retained cells have clean
warning/error consoles.

Evidence: `shots/2026-08-07/responsive-shell-current/`.

## Remaining adaptation matrix

The shared API is now available, but the following product surfaces still need
separate behavior decisions and real multi-size proof:

1. Pull Request list/detail: collapse or overlay the 50% detail dock before its
   360px minimum squeezes the list.
2. Settings: verify control rows, custom-model grids, profile/projects lists,
   and sidebar behavior at compact widths.
3. Thread overlays: environment panel, diff/browser docks, and selection
   actions still need viewport-clamped positioning. The shared Menu primitive
   already clamps measured popup coordinates to its measured viewport; Search
   command and Composer model overlays are separately proven at the Desktop
   minimum below.
4. Very short windows: verify Composer, transcript, sidebar footer, and Settings
   action rows at the desktop minimum height of 650 and below on non-desktop
   hosts.

These rows remain open; the first shell/composer slice does not certify the
entire application as responsive.

## Kanban follow-up

The 900px project board proved that the route-owned three-column layout was
already the correct information architecture, but the shared column root's
256px minimum escaped its 196px host and pushed content beyond the viewport.
Column roots, vertical scrollers, and card lists now shrink to their route host:
196px at 900, 237.33px at 1024, and 376px at 1440. All three columns remain
simultaneously visible and keep independent vertical scrolling.

## Settings sidebar follow-up

Settings navigation now follows the Web sidebar's single-scroll-owner model:
the fixed 46px titlebar sits above one vertical viewport containing Back,
Search, navigation, and search results. Search results no longer create a
nested scroll view.

At 900x650 the scroll viewport is 604px and the final Advanced row remains
fully visible at y614..642. The viewport grows to 774px at 820px height and
854px at 900px height, while the main Settings content keeps its separate
vertical scroll owner.

## Overlay follow-up

Desktop enforces a 900x650 minimum content size, so the shared `compact` band is
not reachable in the current Native shell. It remains part of the cross-host
API for Lynx-for-Web and future hosts.

At the Native Desktop minimum, the real Sidebar Search command popup occupies
x162..738/y103..476 inside the 900x650 dialog viewport. Its result
`SCROLL-VIEW` occupies x163..737/y153..429. The real Composer model popup
occupies x472..732/y131..431, with its provider `SCROLL-VIEW` at
x478..726/y137..425. Neither popup overflows the viewport, and both keep their
own vertical scroll owner.

This closes generic Menu positioning plus these two high-value popup consumers;
it does not certify environment, diff/browser docks, or selection-action
overlays. Evidence: `shots/2026-08-07/responsive-overlays-current/`.
