# Settings Profile Share

Status: retained Lynx-for-Web UI evidence, exact-owned Native copy evidence,
and packaged-runtime proof for the Profile Share flow.

## Residual

Web exposes a real Share dialog that previews an activity card, copies/saves a
PNG, and opens X, LinkedIn, or Reddit composers. Lynx still exposed the older
text-only `Copy summary` action.

## Implementation

- Replaced `Copy summary` with the Web action pair: Share and Edit.
- The Share action uses the exact central `share-os.svg` asset.
- Added a deterministic 860x440 SVG activity-card builder using the canonical
  profile stats, token heatmap, edited identity, avatar color, and top-provider
  projection.
- The dialog previews that same SVG and exposes Copy, Save, X, LinkedIn, and
  Reddit actions.
- Lynx-for-Web rasterizes SVG through `HTMLImageElement` + canvas.
- Native rasterization uses lazy-loaded `sharp@0.34.5` on the host thread:
  `SVG -> PNG Buffer -> nativeImage -> system clipboard` or save dialog.
- Clipboard and dialog bridges are async, so rasterization does not block
  Lynxtron startup or its main event loop.
- Social actions copy the card before opening the corresponding HTTPS
  composer through the existing shell port.

## Failed candidates

Three built-in `nativeImage` SVG inputs were rejected by Lynxtron 0.0.7:

1. base64 SVG data URL;
2. SVG Buffer;
3. percent-encoded SVG data URL.

A synchronous `/usr/bin/sips` experiment also blocked the host bridge and was
rejected. None of those implementations remain in the patch. The final Sharp
path is asynchronous and passed real Native copy.

## Browser

The same isolated service `ws://127.0.0.1:58155`, trusted origin
`http://localhost:8998`, Profile route, dark theme, comfortable density, and
`1280x820` DPR 1 were used.

- Share dialog: `360,190,560x440`.
- Preview: `385,255,510x246`.
- Card: `386,256,508x244`.
- Preview content is the canonical `860x440` SVG.
- Browser clipboard image permission is denied in the isolated automation
  context; the UI reports the Web-equivalent fallback:
  `Image copy unavailable. Use Save instead.`
- Connection diagnostics remained empty.

The retained frame is `lynx-web-share.png`.

## Native

- Production bundle:
  `9787137ba77185d02730dfbeda22b8f47a1e8baf34f5ebbcdfd4c669cad34488`;
- read-only SQLite online-backup:
  `e9d5b3c73cea5afe9153667feb2b2179a7de99482c17706d544686a966b982d3`;
- owned launch root/child: `67053 -> 67059`;
- PID-derived DevTool target: `localhost:8903/session 1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.

Real DevTool touches activated Profile, Share, and Copy. The UI then reported
`Copied image to clipboard.` macOS clipboard inspection returned PNG, TIFF,
AVIF, JPEG, and other image representations. The retained PNG:

- is exactly `860x440`;
- hashes to
  `fe0d5164603a8e13ff67952a1e2d359ef355c3e1bb39eeb9971a6b2b05c9d36e`.

Native dialog/preview/card geometry matches the Browser cell, retry count is
zero, and the DevTool warning/error console is empty.

## Packaging

Sharp is a declared Lynx dependency and is externalized as an ESM module.
It is lazy-loaded only when Share is used.

`stage-sharp-runtime.mjs` copies the exact platform runtime and transitive
packages into `dist/desktop/node_modules`. Its focused test resolves Sharp
from `dist/desktop`, not the workspace fallback, and generates a valid PNG.

`bun run pack` passed and generated:

`apps/lynx/dist/Synara-Lynx-v0.5.5-lynx.0-darwin-arm64.dmg`

The packaged app contains:

- `node_modules/sharp/lib/index.js`;
- `@img/sharp-darwin-arm64/lib/sharp-darwin-arm64.node`;
- `@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.17.3.dylib`.

Loading Sharp directly from packaged `Resources/app/package.json` generated
an independent `860x440` PNG. The DMG hash is retained in
`package-hashes.txt`.

The packaging run rebuilt the staged Lynx bundle after the retained Native
capture; that final staged bundle hashes to
`f64fad427700cb335b09efb7e6446994abe65a77a32b521f8d20958d59d21fdc`.
It is recorded separately rather than retroactively relabeling the earlier
PID-owned capture.

## Verification

- Focused Profile Rstest: 1 file, 5 tests passed.
- Sharp runtime staging test: 1/1 passed.
- Lynx-for-Web production build passed.
- Native/Desktop production build passed.
- `bun run pack` passed.
- Uncached changed-lines React Doctor against `a3e73fbf`, including untracked
  implementation files, scanned 11 files and reported zero diagnostics.
