# Settings Profile paired calibration

## Passing cells

- Web original: `web-light.png`, `web-dark-final.png`
- Lynx-for-Web: `lynx-light-final.png`, `lynx-dark-valid.png`
- Route: Settings Profile
- Snapshot: shared isolated server at `ws://127.0.0.1:58400`
- Viewport: `1280 x 820`, DPR 1
- All four retained PNGs are `1280 x 820`.
- Theme was selected through each client's rendered Appearance controls.
- Both clients were restored to System after capture.

## Harness

- Web origin: `http://localhost:9201`
- Lynx host: `http://localhost:9201/lynx/index.html?route=/settings/profile`
- State directory: `.synara-profile-paired-current`
- Server PID: `19838`
- Web PID: `19837`
- Named browser session: `synara-profile-paired` (closed after capture)
- Final Web bundle SHA-256:
  `f8c11af66776af78a9e029fe742630f0da33416f08092ab5f877e1266b2aaae6`
- Final Native bundle SHA-256:
  `1f012fa4ce122c3523eb0704e45666b279f27604b650fcda28443cf40d43b635`
- The output and staged copies match for both bundles.

## Result

Profile first-screen geometry was already effectively exact:

- Actions: `408,32,720x28`
- Identity: `408,88,720x134`
- Stats: `408,250,720x68`
- Activity title: `408,346,720x20`
- Activity section: Web `168.546875px`, Lynx-for-Web `168.5px`

The concrete residual was the stats card material. Web uses separate
low-alpha outer-border and divider materials, while Lynx used the full border
token for both. Web also assigns each wide-layout divider to the preceding
tile through `divide-x`; Lynx assigned it to the following tile.

The fix introduces theme-specific Profile stats border/divider tokens and
makes the first four wide-layout tiles own their right divider. In the valid
dark pair, sampled outer-border and divider pixels match exactly. The valid
light pair differs by one RGB level at divider samples because of browser
alpha rounding. Stats-region mean absolute RGB difference is `0.733946` in
light and `1.979922` in dark; the remaining visible delta is text
rasterization rather than structure or material ownership.

## Invalid diagnostics

The following discarded captures were not passing evidence and were removed
from the retained set:

- `web-dark.png` / `lynx-dark.png`: theme mismatch.
- `web-dark-media.png` / `lynx-dark-media.png`: browser media emulation changed
  Web but did not change Lynx's product-owned System resolution.
- `lynx-dark-final.png`: Web had been changed through its Appearance control,
  but Lynx still retained System.
- `web.png`, `lynx-initial.png`, `lynx-light.png`, and
  `lynx-light-fixed.png`: intermediate calibration frames.

The final accumulated console includes two TanStack not-found warnings caused
by an intentionally discarded `/settings/appearance` route probe. The valid
product route is `/settings?section=appearance`. Retained capture error logs
are empty. The recurring Lynx-for-Web initialization deprecation warning is
an upstream harness warning already present before this slice.

## Verification

- `bun run test src/app/SettingsProfilePanel.lynx.test.tsx`: 5/5 passed.
- `SYNARA_WS_URL=ws://127.0.0.1:58400 bun run build:web`: passed.
- `bun run build`: passed with the existing unsupported CSS and optional
  `ws` native-addon warnings.
- React Doctor 0.9.11 against `92c0fe91`: score 100, no issues.
- `git diff --check`: run before commit.

This is a Web/Lynx-for-Web Profile slice, not full Native certification and
not global P10 completion.
