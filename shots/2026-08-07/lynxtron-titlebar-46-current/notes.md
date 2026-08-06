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
- Focused window-chrome and sidebar suites pass 6/6. The configured
  Native/Desktop production build passes with only the existing encoder and
  optional `ws` warnings.
- Exact-owned Native bundle
  `7bedabf8d0477d5a47b53a944a3f004d2f91a8a59c6ae6d07fe285c31e62b6b5`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. Owned child PID `64576`
  was resolved by `lsof` to `localhost:8903/session 1`.
- Native DevTool directly measures the sidebar titlebar and adjacent main
  header at 46px. The sidebar resolves `-x-app-region: drag`; the outer window
  and LynxView both measure 1280x820 logical pixels / 2560x1640 physical pixels.
  Warning/error console output is empty.
- Cleanup: the exact-owned Native process exited after capture. Unrelated
  Lynxtron clients on 8901, 8902, and 8904 were not touched.
