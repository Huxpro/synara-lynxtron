# Current-head Appearance fidelity proof

## Harness

- Date: 2026-08-05
- Viewport: `1280x820`, DPR 1, light theme
- Server: owned isolated Synara process on `127.0.0.1:60462`
- State: `/Users/bytedance/github/synara/.p10-view/dev/state.sqlite`
- Web authority: `http://localhost:8921/`
- Lynx-for-Web: `http://localhost:8921/lynx-current/`
- Both clients used the same trusted `localhost:8921` origin, server snapshot,
  theme, viewport, and product navigation path.
- Final Lynx-for-Web bundle SHA-256:
  `df1978d4a2575d7ed2aa72afb546286f839d8ee5d574f4c3139bb19dc8ca75f1`.
- Final Native/Desktop bundle SHA-256:
  `53c91cdd12e23076c6b9ef1e459712cc5230754888ef4419dbcd2308b585463b`.

The initial independent `127.0.0.1:8922` Lynx static origin was rejected by
the server's trusted-origin gate and displayed `Synara is offline`. That was a
harness failure, not product evidence. The retained run served both products
from the server-configured `localhost:8921` origin without relaxing the
security policy.

## Measured residual and repair

The first current-head pair showed exact page/header alignment, but each
Lynx-for-Web Theme Pack card was `467px` tall versus Web's `475.5px`. The
difference came from both Lynx font controls rendering at `28px` while the Web
authority controls were `32px`. Across two cards, the `8px` per-card error
accumulated into a `17px` early offset at `UI density` and every following row.

After assigning the shared Theme Pack font control a `32px` height:

| Anchor             |     Web | Lynx-for-Web |    Delta |
| ------------------ | ------: | -----------: | -------: |
| Light card height  | `475.5` |        `475` | `-0.5px` |
| Dark card height   | `475.5` |        `475` | `-0.5px` |
| UI density y       |  `1278` |       `1277` |   `-1px` |
| Time and reading y |  `1668` |       `1667` |   `-1px` |

The remaining one-pixel downstream difference is browser fractional rounding,
not a repeated owner error.

The density segmented group then measured `251.2px` in Lynx versus `245.2px`
in Web. Theme buttons already matched exactly because their generated icons
changed intrinsic sizing. A text-only owner class now uses Web's `9px`
horizontal padding without disturbing the icon-bearing theme segments:

| Density option | Web width | Lynx-for-Web width |
| -------------- | --------: | -----------------: |
| Compact        |    `72.3` |             `72.3` |
| Comfortable    |      `92` |               `92` |
| Spacious       |    `72.8` |             `72.8` |

## Interaction proof

- Navigation used the rendered `Settings` and `Appearance` controls in both
  products; no history or SQLite fixture was written.
- The final Lynx-for-Web terminal-font control opened its real `224px`
  suggestion popup and rendered shared suggestions including `JetBrains Mono`,
  `Fira Code`, and `Menlo`.
- Theme Pack color controls remained `176x32`; contrast tracks remained
  `176px`; Time format remained `160x32`.
- The final client was online and `agent-browser errors` was empty.
- All retained PNGs are exactly `1280x820`.

## Evidence

- `appearance-web-1280x820-light.png`: current Web authority.
- `appearance-lynx-web-1280x820-light.png`: current-head Lynx before the
  measured font-height repair.
- `appearance-lynx-web-1280x820-light-fixed.png`: card-height repair before the
  text-only segmented correction.
- `appearance-lynx-web-1280x820-light-final.png`: final geometry with the real
  terminal-font suggestion popup open.

## Gates

- Focused Appearance and Theme Pack tests: 2 files, 7/7 passed.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with only the existing
  `color-scheme`, `overflow-wrap`, and optional `ws` native-module warnings.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
