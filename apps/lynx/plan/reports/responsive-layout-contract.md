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
- Lynx-for-Web implements the same host-facing contract: `windowGetViewport`
  reads the browser content viewport and browser resize publishes
  `viewport:resize`. The fast harness therefore exercises the same user-space
  hook and root classes instead of remaining in the `unknown` band.
- Lynx projects the result as
  `SliceRoot--viewport-{unknown|compact|medium|wide}` plus numeric
  `data-viewport-width/height`, giving CSS and DevTool one auditable contract.
- Lynx also projects cumulative
  `SliceRoot--viewport-{sm|md|lg|xl|2xl|3xl|4xl}-up` classes from the same
  shared breakpoint table. Feature CSS can therefore reproduce a canonical
  Web `sm` or `md` transition without inventing a platform-local threshold.

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

Lynx-for-Web live resize evidence is retained separately at
`shots/2026-08-07/responsive-web-host-current/`: one page changed from
`compact/640x820` to `wide/1024x820`, including numeric root attributes.

## Remaining adaptation matrix

The shared API is now available, but the following product surfaces still need
separate behavior decisions and real multi-size proof:

1. Settings: verify remaining collection controls at compact widths. Profile,
   Integrations, and Custom Models are closed below.
2. Thread overlays: environment panel, diff/browser docks, and selection
   actions still need viewport-clamped positioning. The shared Menu primitive
   already clamps measured popup coordinates to its measured viewport; Search
   command and Composer model overlays are separately proven at the Desktop
   minimum below.
3. Very short windows: remaining Settings action surfaces still need separate
   proof. Landing, sidebar footer, and Transcript are closed below.

These rows remain open; the first shell/composer slice does not certify the
entire application as responsive.

## Kanban follow-up

The 900px project board proved that the route-owned three-column layout was
already the correct information architecture, but the shared column root's
256px minimum escaped its 196px host and pushed content beyond the viewport.
Column roots, vertical scrollers, and card lists now shrink to their route host:
196px at 900, 237.33px at 1024, and 376px at 1440. All three columns remain
simultaneously visible and keep independent vertical scrolling.

Below the medium band, the board follows the Web authority instead of crushing
columns further: `KanbanScroller` owns horizontal scrolling and each column
returns to a 256px minimum. At 600px the 344px route viewport scrolls across an
824px rail, including a real 248px card; at 900px the rail collapses back to the
644px viewport and all three 196px columns remain visible. Evidence:
`shots/2026-08-07/responsive-kanban-compact-current/`.

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

## Pull Request detail follow-up

The real Web route opens its Pull Request dock as a 50/50 master-detail split.
At the Electron reference's 1313px content width, the list and dock are each
528px after the fixed 256px sidebar.

The old Native 900px composition had only 644px after the sidebar but still
reserved the dock's 360px minimum. That left a 284px list scroller and a 252px
selected row. The route now projects its real selection as
`SharedPrRouteBody--detail-open`. Compact and medium bands use a single-surface
master-detail flow: the list viewport collapses while the dock owns the full
644px route body, and the real Close action restores the list.

Wide windows retain the Web-authority split. At 1440px the list is 592px and
the dock is 591px plus its 1px divider. Both surfaces keep their independent
vertical scroll owners. Evidence:
`shots/2026-08-07/responsive-pr-detail-current/`.

## Settings Profile follow-up

Profile now follows the Web breakpoint contract through shared cumulative root
classes. Stat tiles use 2 columns below 640px, 3 columns from `sm=640`, and 5
columns from `lg=1024`. Activity insights and plugin usage stack until
`md=768`; model usage stacks until `sm=640`.

Real Lynx-for-Web geometry proves the transitions: 600px yields two 147px stat
columns and full-width insight columns; 640px yields three 111.3px stat
columns; 1024px restores five 143.6px stat columns and two 336px insight
columns with the canonical 48px gap. Evidence:
`shots/2026-08-07/responsive-settings-profile-current/`.

## Settings Integrations follow-up

Integrations now follows its Web `sm` behavior. Below 640px, its route-owned
form rows stack vertically, the connection name input fills the available
width, and project selection is one column. From `sm=640`, the input returns to
256px and projects return to two columns.

Real Lynx-for-Web geometry with four canonical projects proves the transition:
600px yields a 270px input and four 270px project rows; 640px yields a 256px
input and two 151px project columns; 1024px preserves the wide horizontal rows
and two 269px project columns. Evidence:
`shots/2026-08-07/responsive-settings-integrations-current/`.

## Settings Custom Models follow-up

The custom-model editor stacks provider, slug input, and Add action while the
Settings content rail is narrow. Because the 256px Settings sidebar remains
visible, the Web viewport-level `sm` transition was too early for this
composition: a measured 640px window left only an 81px slug input.

The editor therefore uses the shared `md-up` class for its horizontal form.
At 600px and 640px, all three controls own the full 270px/310px row width. At
1024px, the original 144px provider + 369px input + 69px Add anatomy returns.
Evidence: `shots/2026-08-07/responsive-settings-custom-models-current/`.

## Short-window follow-up

The sidebar already kept one scrollable list viewport above a fixed 44px
Settings footer. That ownership remains correct down to a measured 200px
height.

The landing main surface did not have a scroll owner. At 900x200 its 244px
heading/Composer stack was centered inside a 154px body and clipped at both
edges. `ThreadsLandingBody` now owns vertical scrolling, while a
`min-height:100%` inner wrapper preserves centering whenever the stack fits.
The 200px body now scrolls 90px between a fully visible heading and a fully
visible Composer; at 480px it remains non-scrolling and centered. Evidence:
`shots/2026-08-07/responsive-short-window-current/`.

Compact landing headings are also fluid. The fixed 321px ordinary and 400px
project heading widths exceeded a 600px window's 344px main column once the
landing frame padding was included. Compact headings now use the available
width minus the canonical 48px inline padding; at 600px the retained heading is
248px and remains inside the main column, while 1024px restores the calibrated
321px width. Evidence:
`shots/2026-08-07/responsive-landing-width-current/`.

Transcript uses a shared `short=320px` height class. Below that threshold, the
provider-health banner contracts to 44px, keeps its full accessibility label
while hiding visual description copy, and transcript top padding is removed.
At 280px the real message list grows from 43px to 95px while the 95px Composer
remains intact; at 480px the original 80px banner and 243px list remain
unchanged. A 200px diagnostic frame is retained as a physical budget boundary,
not a supported normal layout. Evidence:
`shots/2026-08-07/responsive-transcript-short-current/`.
