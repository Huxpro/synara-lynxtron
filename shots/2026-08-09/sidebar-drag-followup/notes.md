# Sidebar drag follow-up

- Owned harness: server `58160`, Web `9961`, temporary home
  `.synara-sidebar-followup`, server instance
  `254dd14a-24dd-45d8-be16-aa482ba41aed`.
- Connection preflight passed for Web, Lynx-for-Web, and Native provenance
  against snapshot sequence `0`.
- The refreshed matrix covers ordinary and Settings sidebars at
  `256`, `320`, and `384` pixels in light and dark mode. Every frame is
  `1280×820`, the sash is `10×820`, page errors are empty, transport errors are
  empty, and each page establishes one relay connection.
- Ordinary sidebar geometry is `256/1024`, `320/960`, and `384/896` for
  sidebar/main widths. Settings matches the same split. Ordinary content owns
  a `730px` scroll viewport below the fixed `46px` titlebar and above the fixed
  `44px` footer. Settings owns a `774px` sidebar scroll viewport below its
  fixed titlebar.
- The retained populated-fixture scroll evidence remains
  `top=0`, `mid=111`, `bottom=221` for the ordinary sidebar and
  `mid=164`, `bottom=328` for the short Settings sidebar. The current follow-up
  source still has the same scroll owners and did not touch their layout.
- Real Chromium mouse input reaches the visible Lynx-for-Web `x-view` sash,
  but the current Web Elements runtime does not publish the ReactLynx
  `bindmousedown` path. Browser drag is not claimed. The rendered Lynx event
  test remains the behavior contract; Native remains the certification
  boundary.
- Source inspection found the shared disclosure still animated width for
  `220ms` during every resize frame. `SidebarDisclosure--resizing` now disables
  width and inner transform transitions only for the active drag, restoring the
  shared open/close motion on release.
- Focused tests: `12/12` pass. Lynx-for-Web and Native/Desktop production
  builds pass with existing warnings.
- Reuse/style checks stop on pre-existing stale generated baselines:
  `p5-r1-reuse-baseline.{json,md}` and
  `p5-r4-core-class-manifest.json`. This slice adds no new component import or
  class family requiring those workspace-wide baselines to be regenerated.
