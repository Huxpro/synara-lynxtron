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
2. Kanban: choose horizontal column scrolling vs stacked/filtered columns at
   compact widths; preserve each column's vertical scroll owner.
3. Settings: verify control rows, custom-model grids, profile/projects lists,
   and sidebar behavior at compact widths.
4. Thread overlays: environment panel, diff/browser docks, menus, and selection
   actions need viewport-clamped positioning.
5. Very short windows: verify Composer, transcript, sidebar footer, and Settings
   action rows at the desktop minimum height of 650 and below on non-desktop
   hosts.

These rows remain open; the first shell/composer slice does not certify the
entire application as responsive.
