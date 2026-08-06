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
- The standard chat header had one additional rem-base residual: Web
  `sm:px-5` resolves to 20px, while Lynx resolved the same utility to 17.5px.
  The shared composition now passes an explicit padded host contract. Web
  consumes that prop without leaking an unknown DOM attribute; Lynx maps only
  non-editor headers to physical 20px left/right padding.
- Electron CDP and PID-derived Native `localhost:8905/session 1` both directly
  measure 46px height and 20px horizontal padding. The Native content edge is
  x=276 from the x=256 main-column origin, exactly matching Electron. The
  final frame remains 2560x1640 and both runtime consoles are clean.
- The titlebar mark also had a paint-owner mismatch. Electron uses the derived
  secondary foreground (`rgba(13,13,13,0.596)`) at host opacity 0.8, while the
  Lynx SVG embedded full foreground and only applied the 0.8 host opacity.
- A lightweight shared `resolveTextForegroundSecondary()` now owns the exact
  light/dark derivation used by both the CSS token builder and Lynx SVG paint.
  This avoided the rejected first implementation, which imported the complete
  resolved-token builder and increased the Lynx bundle by about 27kB.
- Final bundle size is 3063.7kB, about 1.2kB above the pre-tone build. Native
  PID `81728`, PID-derived `localhost:8903/session 1`, embeds
  `rgba(13, 13, 13, 0.598)` in every logo path and resolves 14x14 at opacity
  0.8. Electron reports the equivalent rounded CSS color and same opacity.
  Native warning/error console output is empty.
- Cleanup: the exact-owned Native process exited after capture. Unrelated
  Lynxtron clients were not touched.
