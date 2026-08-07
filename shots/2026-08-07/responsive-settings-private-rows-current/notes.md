# Responsive Settings private-row evidence

- Date: 2026-08-07
- Runtime: current Lynx-for-Web production bundle under an isolated same-origin
  harness.
- Server/static ports: `58126` / `9005`.
- Theme/density: light / comfortable.
- Device pixel ratio: `1`.

## Failure

General and Appearance both use the shared Web `SettingsRow`, whose layout
stacks below `sm=640`. Their Lynx element adapters kept private horizontal row
CSS at every width.

At `320px`, Appearance fixed controls squeezed the copy rail to `16–22px`.
Rows expanded to `707–2633px`, and the UI-density row painted `273px` into its
`270px` card. The route still had a vertical scroll owner, but individual rows
were not usable.

## Fix

Both private row adapters now consume the shared viewport classes:

- compact rows stack copy and control with a `10px` gap;
- copy loses its desktop right padding;
- controls own the full row width;
- Appearance font and select controls become fluid;
- `sm-up` restores horizontal rows, desktop padding, and the original
  `224px` / `160px` fixed control widths.

## Geometry

At `320x820`:

- Settings content owns `320px` with no horizontal overflow;
- every card row is `270px` wide with `scrollWidth === clientWidth`;
- Appearance copy/control rails are each `246px`;
- the eight representative Appearance rows are `99–153px` tall instead of
  `707–2633px`;
- General copy/control rails are each `246px`, including all rendered
  Environment preference switches.

At `640x820`, live resize adds `SliceRoot--viewport-sm-up`:

- Appearance rows return to horizontal composition;
- representative rows are `590px` wide with no horizontal overflow;
- terminal font returns to `224px`;
- time format returns to `160px`.

Artifacts:

- `appearance-320.json`, `appearance-320.png`;
- `appearance-640.json`, `appearance-640.png`;
- `general-320.json`, `general-320.png`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.

All PNG dimensions match the requested cells. Page errors are empty. Console
output contains host setup logs and the registered upstream
`@lynx-js/web-core` deprecated-initialization warning.

## Verification

- General + Appearance focused Rstest: `2 files / 6 tests`;
- Lynx-for-Web production build: pass.

- Native/Desktop production build: pass.
