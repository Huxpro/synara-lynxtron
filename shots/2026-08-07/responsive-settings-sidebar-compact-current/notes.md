# Compact Settings sidebar evidence

- Date: 2026-08-07
- Runtime: current Lynx-for-Web production bundle in an isolated named browser
  session.
- Theme/density: light / comfortable.
- Height: `820`; device pixel ratio: `1`.

## Web authority

Below `md=768`, the Web Sidebar uses a Sheet overlay instead of reserving its
desktop width in the main layout.

The old Lynx shell always reserved the fixed 256px Settings sidebar. At a
400px window this left:

- Settings main/content width: `144px`;
- content rail after padding: `96px`;
- General header height: `182px`.

The content did not technically overflow its 144px viewport, but it was no
longer a usable desktop-tool composition.

## Fix

The shared app shell is now a positioned container. In compact windows, the
existing `SidebarDisclosure` becomes an absolute overlay at `x=0`, `z=50`.
Its already-verified interaction hiding, focus disabling, motion, and cleanup
contracts remain unchanged.

## Geometry

At `400x820`, sidebar open:

- overlay sidebar: `256x820`, `x=0..256`;
- Settings page/content: full `400x820`, `x=0..400`;
- content rail: `400px`;
- General header: `352x74`, `x=24..376`.

The real titlebar Toggle closes the overlay:

- sidebar/disclosure unmount;
- page/content stay `400x820`;
- Toggle remains reachable at `x=90..114`.

At `900x820`, compact overlay behavior is absent:

- sidebar returns to its normal 256px layout ownership;
- Settings page/content use the remaining `644px`.

Artifacts:

- `open-400.json`, `open-400.png`;
- `closed-400.json`, `closed-400.png`;
- `closed-900.json`, `open-900.json`, `open-900.png`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.

PNG dimensions match the requested viewports. Page errors are empty. Console
output contains only host setup logs and the registered upstream
`@lynx-js/web-core` deprecated-initialization warning.

## Verification

- Settings sidebar + titlebar controls focused Rstest: `8/8`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- React Doctor changed scope: `100/100`, zero diagnostics.
