# Chat content seam current-head fidelity

- Date: 2026-08-07
- Runtime: current Lynx-for-Web and exact-owned Native production bundles.
- Desktop viewport: `1280x820`; compact diagnostic: `600x820`.
- Themes: light and dark.

## Failure

Web renders ordinary chat routes and Settings as a raised content card over the
sidebar. The seam-side material has:

- `14.4px` top-left and bottom-left radii;
- a theme-aware 8% inset edge;
- a restrained `-6.5px 0 12px -10px` depth shadow.

Lynx previously rendered `.AppMain` and `.SettingsPage` as flat rectangles.
After duplicate sidebar borders were removed, the entire light seam became one
undifferentiated white plane. Dark mode likewise lacked the raised-card edge
and depth visible in the current Electron authority.

## Fix

The router now projects explicit open/closed classes for ordinary and Settings
main surfaces. One shared material recipe applies only when:

- the sidebar is open; and
- the viewport is at least `md`.

The recipe is:

- left radii `14.4px`;
- light edge/shadow: black 8% / black 10%;
- dark edge/shadow: white 3% / black 36%;
- `overflow: hidden`, matching the Web content card clip.

Closed surfaces and compact layouts remain square and shadowless.

## Lynx-for-Web

Ordinary main:

- light open: `x=256`, `1024x820`, radii `14.4/0/14.4/0`,
  `inset 1px + -6.5px depth`;
- dark open: same geometry with a calibrated white 3% edge and black 36%
  depth;
- light closed: `x=0`, `1280x820`, radii `0`, shadow `none`;
- compact open at `600px`: `x=256`, width `344`, radii `0`, shadow `none`.

Settings:

- light open: `x=256`, `1024x820`, radii `14.4px`, light seam shadow;
- light closed: `x=0`, `1280x820`, radii `0`, shadow `none`.

Pixel samples confirm the edge and near-seam depth are actually painted, rather
than existing only in computed style.

## Native

The exact final bundle preserves the same material:

- ordinary light open: `14.4px` left radii,
  `1px 0 0 inset #00000014,-6.5px 0 12px -10px #00000019`;
- ordinary dark open after real Settings → Appearance → Dark → Back actions:
  `1px 0 0 inset #ffffff07,-6.5px 0 12px -10px #0000005b`;
- the calibrated dark edge paints at RGB `23` over the RGB `16` main surface,
  matching the current Electron seam's measured `+7` relative lift instead of
  mechanically using the nominal Web 8% token;
- Settings light open after real Settings footer touch: identical light seam;
- Settings dark open after real Settings footer touch: identical calibrated
  dark seam;
- Settings dark closed after real Toggle touch: radii `0`, shadow empty,
  full `1280x820`.

All open desktop surfaces retain `x=256`, width `1024`; the material adds no
layout width.

The final Native run used isolated server `58131`, isolated
`SYNARA_LYNX_USER_DATA_DIR`, PID `59534`, and PID-derived
`localhost:8901/session 1`. Its session URL was the exact staged
`apps/lynx/dist/desktop/main.lynx.bundle`.

## Verification

- Desktop shell + Menu/Composer overlay focused Rstest:
  `3 files / 16 tests`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- React Doctor changed-lines scan against parent `9ace2adc`: zero errors and
  zero warnings. The commit hook's generic warning came from its tool fallback,
  not a staged diagnostic;
- browser page errors: empty;
- final Native warning/error console: empty.

Artifacts:

- Web: `light-open`, `dark-open`, `light-closed`, `compact-open`,
  `settings-light-open`, and `settings-light-closed` JSON/PNG evidence;
- Native: final ordinary light/dark and Settings open/closed box/style/JPEG
  evidence;
- `errors-final.txt`, `console-final.txt`, `native-console-final.json`,
  `native-session-final.json`, `native-runtime-final.json`,
  `bundle-hashes.txt`, `react-doctor.json`.
