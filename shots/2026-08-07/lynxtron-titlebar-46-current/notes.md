# Lynxtron hidden titlebar top-chrome alignment

Status: retained current-head Electron authority and exact-owned Native evidence

- Source base: `bc846aab`.
- Electron reference ran with its real desktop service and CDP on
  `127.0.0.1:19321`. Both renderer drag frames measured 46px high: the
  256px sidebar header and the adjacent chat header.
- After the Lynxtron shell adopted macOS `hiddenInset`, the old Lynx sidebar
  titlebar remained hard-coded to 48px while the shared chat header and native
  traffic-light geometry were based on 46px. The extra two pixels created a
  visible seam and shifted the sidebar content one pixel below the traffic-light
  center.
- `.AppSidebarTitlebar` now uses 46px, matching
  `CHAT_SURFACE_HEADER_HEIGHT_PX` and the current Electron renderer.
- The same runtime comparison found two horizontal/logo residuals. Electron
  places the 14x14 mark 12px from the sidebar edge; Lynx used 14px right
  padding. Lynx also interpreted the shared `size-3.5` utility against its
  14px rem base, producing a 12.25px SVG, and the platform adapter had dropped
  the shared `shrink-0` base class.
- The Lynx titlebar now keeps its 14px leading ownership but uses 12px trailing
  padding. The Synara logo adapter preserves `shrink-0 text-foreground` and
  maps the Web-only `size-3.5` token to the same physical 14px while leaving
  caller inline styles authoritative.
- Focused window-chrome, sidebar, and logo suites pass. The configured
  Native/Desktop production build passes with only the existing encoder and
  optional `ws` warnings.
- The initial 46px proof used bundle `7bedabf8…`, owned PID `64576`, and
  PID-derived `localhost:8903/session 1`. The final logo/padding proof uses
  bundle `fe48cd46…`, owned PID `7226`, and PID-derived
  `localhost:8905/session 1`; the earlier guessed 8903 attempt was rejected.
- Native DevTool directly measures the sidebar titlebar and adjacent main
  header at 46px. The sidebar resolves `-x-app-region: drag`; the outer window
  and LynxView both measure 1280x820 logical pixels / 2560x1640 physical pixels.
  Final Native geometry measures the logo at 14x14 with `flex-shrink: 0`,
  x=229..243 inside the x=0..255 sidebar content edge, leaving the same 12px
  trailing gap as Electron. Warning/error console output is empty.
- Cleanup: the exact-owned Native process exited after capture. Unrelated
  Lynxtron clients were not touched.
