# Lynxtron titlebar controls current-head fidelity

Status: retained exact-owned Native geometry and interaction evidence plus
current Electron CDP authority

- Source base: `58edd069`.
- Electron's open-sidebar cluster directly measures Toggle 24x24/r6 at
  x=90,y=11, Back 28x28/r10 at x=116,y=9, and Forward 28x28/r10 at
  x=146,y=9. Disabled navigation opacity is 0.64.
- Internal glyph geometry is also exact: Electron Toggle uses a centered
  16x16 central icon while Back/Forward use 24x24 SVGs. Lynx now resolves the
  same 16/24/24 geometry at x=94/118/148.
- Lynx previously rendered only the titlebar logo. The new control cluster is
  functional rather than decorative: Toggle changes real sidebar layout state;
  Back and Forward call the existing TanStack memory history and derive
  disabled/focusable state from `__TSR_index` and history length.
- The same component instance owns both placements. With the sidebar open it
  sits after the 90px macOS traffic-light gutter; when closed it becomes a
  fixed top-left cluster at x=90 and the sidebar column is removed. Standard
  main headers reserve a 212px leading inset, matching Electron's closed-state
  title position.
- The sidebar-hidden glyph uses the exact central icon. Back/Forward use the
  exact `IoIosArrowRoundBack` / `IoIosArrowRoundForward` paths from the
  Electron reference. Two rejected intermediates were not retained: the
  unrelated curved `arrow-rounded` reply glyph, then CSS rotation whose Lynx
  transform origin moved Back to x=94,y=-13.
- Focused history/controls tests pass 6/6. Native/Desktop production build
  passes with only the existing encoder and optional `ws` warnings.
- Exact-owned final bundle
  `4b2b5d5418c2956de72a8f1c91120caa452ade36d2f3e0f4965a4e38b9d67b08`
  ran under PID `4727`, PID-derived `localhost:8903/session 1`.
- Supported Native touch proved the complete sequence:
  Landing (Back/Forward disabled) -> Kanban (Back enabled) -> Back to Landing
  (Forward enabled) -> Forward to Kanban -> close sidebar -> reopen sidebar.
  The final state restored the sidebar.
- Open and closed control geometry is identical to Electron:
  x=90/116/146 and 24/28/28px. Closed Kanban header content begins at x=212.
  Both retained frames are 2560x1640 and warning/error console output is empty.
- Electron gives the Toggle glyph an additional 75% muted tone while Back and
  Forward keep the full secondary foreground. Lynx now mirrors that layer
  ownership: exact-owned Native computes Toggle secondary opacity 0.75 and
  both navigation secondary layers at opacity 1, without changing disabled
  whole-control opacity.
- Electron Toggle hover resolves to a 4% ink surface, full foreground glyph,
  and opacity 1. Native desktop does not publish `mouseenter` from DevTool
  `mouseMoved`, so the supported pointer-press path was used instead.
- Native press publishes `ui-pressed`, resolves the same 4% ink surface,
  switches secondary/foreground SVG layers from 0.75/0 to 0/1, and keeps
  whole-control opacity 1. Release toggled the sidebar as expected; the
  follow-up restored it to open. Console remained empty.
- Settings intentionally retains its established real `Back to app` surface;
  this global cluster is not claimed on the separate Settings shell.
- Sidebar visibility remains session-local and defaults open, matching the Web
  provider's default. No new persistence schema or hidden preference was added.
- Cleanup: the exact-owned Native process exited after capture and unrelated
  Lynxtron clients were untouched.
