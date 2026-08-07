# Responsive Settings Custom Models evidence

- Date: 2026-08-07
- Runtime: current Lynx-for-Web production bundle staged under a same-origin
  isolated Synara Web harness.
- State: Settings → Models, default visible Custom models editor.
- Theme/density: light / comfortable.
- Device pixel ratio: `1`.

## Web authority

The Web custom-model editor uses `flex-col sm:flex-row`: provider, model slug,
and Add action stack when the available layout is narrow.

The direct viewport breakpoint cannot be copied mechanically into the Lynx
shell because the fixed 256px Settings sidebar remains visible. At a 640px
window the Profile/Settings content rail is only 336px wide. The first
`sm-up` implementation proved this constraint by shrinking the model-slug input
to only `81px`.

## Final adaptation

The editor now stacks by default and returns to its wide horizontal anatomy at
the shared `md-up` breakpoint:

- provider trigger and Add action fill the available cross-axis while stacked;
- the model input keeps the full available width;
- from `md=768`, provider returns to `144px`, Add to `69px`, and the input owns
  the remaining row width.

Real Lynx-for-Web geometry:

- `600x820`: editor `270x104`; provider/input/Add widths are all `270`;
- `640x820`: editor `310x104`; provider/input/Add widths are all `310`;
- `1024x820`: editor `598x32`; provider `144`, input `369`, Add `69`.

Artifacts:

- `compact-600.json`, `compact-600.png`;
- `compact-640.json`, `compact-640.png`;
- `wide-1024.json`, `wide-1024.png`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.

All PNG dimensions match their requested viewport. Page errors are empty.
Console output contains only host setup logs and the registered upstream
`@lynx-js/web-core` deprecated-initialization warning.

## Verification

- Custom Models + responsive focused Rstest: `4/4`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- React Doctor changed scope: `100/100`, zero diagnostics.

The named browser session, `58123/9002` harness, staged `/lynx` assets, and
temporary isolated home were removed after capture.
