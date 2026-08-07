# Sidebar top highlight current-head fidelity

- Date: 2026-08-07
- Runtime: current Lynx-for-Web and exact-owned Native production bundles.
- Viewport: `1280x820`.
- Themes: light and dark.

## Failure

Web's shared sidebar material includes a one-pixel inset top highlight:

- light: black 2.5%;
- dark: white 2.4%.

The generated Native theme projection already carried calibrated equivalents
(`3%` / `2.5%`), but neither `.AppSidebar` nor `.SettingsSidebar` consumed
them. Both sidebar variants therefore rendered as completely flat fills.

## Fix

Both sidebar owners now apply the same direct material recipe:

- light: `inset 0 1px 0 rgba(0, 0, 0, 0.03)`;
- dark: `inset 0 1px 0 rgba(255, 255, 255, 0.025)`.

The first implementation used `var(--app-sidebar-shadow)`. Exact Native dark
measurement showed the custom property remained on the light value because of
the known Native class-scoped variable inheritance boundary. The final code
uses theme-scoped direct values instead of pretending the variable path works.

## Evidence

Lynx-for-Web:

- ordinary and Settings sidebars resolve black 3% in light;
- ordinary and Settings sidebars resolve white 2.4% in dark;
- both remain exactly `256x820`.

Exact-owned Native:

- ordinary and Settings light sidebars:
  `0 1px 0 inset #00000007`;
- ordinary and Settings dark sidebars after real
  Settings → Appearance → Dark:
  `0 1px 0 inset #ffffff06`;
- real Back returns to the ordinary dark sidebar without changing the material;
- warning/error console is empty.

Pixel samples show the one-pixel highlight is actually painted:

- light top pixel `247/248` over body `255`;
- dark top pixel `23` over body `17`.

The Native run used isolated server `58132`, isolated
`SYNARA_LYNX_USER_DATA_DIR`, PID `17000`, and PID-derived
`localhost:8901/session 1`. Its session URL was the exact staged
`apps/lynx/dist/desktop/main.lynx.bundle`.

## Verification

- Sidebar + desktop shell focused Rstest: `2 files / 7 tests`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- browser page errors: empty;
- Native warning/error console: empty.

Artifacts:

- `light-sidebar`, `light-settings`, `dark-sidebar`, and `dark-settings`
  Lynx-for-Web JSON/PNG evidence;
- Native light/dark ordinary/Settings computed-style evidence and screenshots;
- `pixels.txt`, `native-runtime.json`, `native-session.json`,
  `native-console.json`, `errors.txt`, `console.txt`, `bundle-hashes.txt`.
