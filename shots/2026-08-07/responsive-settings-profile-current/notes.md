# Responsive Settings Profile evidence

- Date: 2026-08-07
- Runtime: current Lynx-for-Web production bundle staged under the same-origin
  isolated Web harness.
- Data: real `stats.getProfileStats` and `stats.getProfileTokenStats` responses
  from an empty isolated Synara home; no renderer fixture or SQLite write.
- Theme/density: light / comfortable.
- Device pixel ratio: `1`.

## Before

At a `640x820` browser viewport the fixed Settings sidebar leaves a `384px`
content viewport and a `336px` Profile rail after content padding.

The old Profile layout ignored the Web responsive contract:

- all five stat tiles remained in one row at `66.8px` each;
- Activity insights and Most used plugins remained two `144px` columns;
- model usage remained a two-column layout at every width.

The Web authority instead uses:

- stat tiles: 2 columns by default, 3 columns from `sm=640`, 5 columns from
  `lg=1024`;
- insights/plugins: one column by default, two from `md=768`;
- model usage: one column by default, two from `sm=640`.

## Shared breakpoint API

`responsiveLayout.logic.ts` now projects cumulative root classes from the same
breakpoint constants used by Web media queries:

- `SliceRoot--viewport-sm-up`;
- `SliceRoot--viewport-md-up`;
- `SliceRoot--viewport-lg-up`;
- and the existing larger breakpoint classes when reached.

The classes are cumulative and independent from the coarse
compact/medium/wide band, so feature CSS can reproduce canonical `sm`, `md`,
and `lg` behavior without private pixel thresholds.

## After

Live Lynx-for-Web geometry:

- `600x820`: no `sm-up`; stat tiles are two `147px` columns over three rows,
  insights/plugins are single full-width columns;
- `640x820`: `sm-up`; stat tiles are three `111.3px` columns over two rows,
  insights/plugins remain single full-width columns;
- `1024x820`: `sm-up md-up lg-up`; stat tiles return to five `143.6px`
  columns, insights/plugins return to two `336px` columns with the canonical
  48px gap.

The real empty stats snapshot has no model-usage rows, so runtime evidence does
not claim populated model geometry. The focused CSS contract verifies the
canonical one-column default and `sm-up` two-column rule.

Artifacts:

- `compact-600.json`, `compact-600.png`;
- `compact-640.json`, `compact-640.png`;
- `wide-1024.json`, `wide-1024.png`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.

All PNG dimensions match their logical viewport. Page errors are empty.
Console output contains only host setup logs and the registered upstream
`@lynx-js/web-core` deprecated-initialization warning.

## Verification

- shared Web responsive logic: `3/3`;
- Lynx responsive + Profile focused tests: `5/5`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- React Doctor changed scope: `100/100`, zero diagnostics.

This slice closes Profile's compact collection reflow. Other Settings
collections, including Integrations project selection and custom-model editor
controls, remain separate responsive decisions.
