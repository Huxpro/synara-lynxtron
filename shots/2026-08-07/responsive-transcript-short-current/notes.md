# Short-window transcript evidence

- Date: 2026-08-07
- Runtime: current Lynx-for-Web production bundle under a same-origin isolated
  Synara harness.
- Data: a real Home thread and real user message were created through canonical
  `orchestration.dispatchCommand` calls; no SQLite writes or renderer fixture.
- Provider state: real Codex unavailable/error presentation.
- Width: `900`; device pixel ratio: `1`.

## Before

At `900x200` the fixed height budget was exhausted by:

- 46px chat header;
- 80px provider-health banner;
- 95px Composer;
- 16px transcript top padding.

The Transcript list consequently resolved to `0px` height. At `900x280` it
recovered only `43px`, while `900x480` provided `243px`.

## Shared short-height contract

`responsiveLayout.logic.ts` now owns a `short=320px` height breakpoint and
projects `SliceRoot--viewport-short-height` without changing the existing width
band.

Below 320px:

- the provider-health frame contracts from 80px to 44px;
- its visual description is hidden while the full title + message remain in
  the banner's accessibility label;
- the dismiss control remains visible;
- transcript top padding drops from 16px to 0.

## After

At `900x280`:

- compact provider banner: `44px`;
- Transcript list: `95px` high, up from `43px`;
- Composer: full `95px`;
- the list remains independently scrollable (`scrollHeight=521`).

At `900x480`, the short-height class is absent and the original 80px banner,
16px transcript inset, 243px list, and 95px Composer remain unchanged.

At the diagnostic extreme `900x200`, the list now has 15px rather than 0px.
This is recorded as a physical budget boundary rather than hidden: header,
provider status, and core Composer cannot all remain full-size while also
providing a normal transcript viewport in only 200px. The supported short
layout is certified at 280px and above.

Artifacts:

- `height-200.json`, `height-200.png`;
- `height-280.json`, `height-280.png`;
- `height-480.json`, `height-480.png`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.

PNG dimensions match the requested viewports. Page errors are empty. Console
output contains only host setup logs and the registered upstream
`@lynx-js/web-core` deprecated-initialization warning.

## Verification

- shared Web responsive logic: `4/4`;
- Lynx responsive, provider banner, and thread-state focused tests: `10/10`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- React Doctor changed scope: `100/100`, zero diagnostics.

The named browser sessions, `58123/9002` harness, staged `/lynx` assets, and
temporary isolated home were removed after capture.
