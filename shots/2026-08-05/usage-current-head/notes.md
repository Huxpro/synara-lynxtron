# Current-head Usage fidelity proof

## Harness

- Date: 2026-08-05
- Viewport: `1280x820`, DPR 1
- Theme: explicitly selected Light through each product's rendered Appearance
  controls before returning to Usage
- Server: owned isolated Synara process on `127.0.0.1:60462`
- Snapshot:
  `/Users/bytedance/github/synara/.p10-view/dev/state.sqlite`
- Snapshot SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`
- Web authority: `http://localhost:8921/`
- Lynx-for-Web: `http://localhost:8921/lynx-current/`
- Final Lynx-for-Web bundle SHA-256:
  `d922e7f2bf5399dfdc758383c2c10267ce50cc47d1caf73a045b50b8e5232286`
- Final Native/Desktop bundle SHA-256:
  `4c5aef8221a4e2b245cd8d9a1b12a3d43e5c967fc3ad5ee0f037a4f8901bcd8`

Both clients used the same trusted origin, snapshot, viewport, theme, and
rendered Settings to Usage navigation path. The unrelated Web provider-update
toast was dismissed through its rendered control before capture. No SQLite
fixture or product history state was written.

## Real state and coverage boundary

The real server returned three provider snapshots:

- Codex: `Unavailable` — could not reach the usage endpoint.
- Claude: `Unavailable` — could not reach the usage endpoint.
- Cursor: `Unavailable` — could not reach the dashboard.

This state visually certifies the Usage section/header, Refresh action,
provider identity, error status pills, unavailable detail rows, card stack,
footer, loading-to-settled behavior, and overflow geometry. It does **not**
visually certify quota meters, pace markers, stale-data notices, or usage-line
rows because those branches were absent from the real snapshot. Their existing
shared derivation and focused tests remain useful source/logic evidence, but
are not represented here as screenshot proof.

## Measured residuals and repair

Before the repair:

| Owner                |                        Web |                   Lynx-for-Web | Result                                                       |
| -------------------- | -------------------------: | -----------------------------: | ------------------------------------------------------------ |
| Header to first card |         first card `y=150` |             first card `y=156` | Lynx root gap was `12px` instead of the shared section `6px` |
| Error detail line    |              `12px/19.5px` |                    `12px/18px` | each card was `1.5px` short                                  |
| Provider title       |            `14px/20px/600` |              `14px/normal/600` | Lynx rendered a 17px title box                               |
| Refresh              | `72x24`, `10px/15px` label | `80.6x25`, `12px/normal` label | generic xs chrome remained visible                           |

After assigning each difference to its actual owner:

| Anchor         |                                   Web | Lynx-for-Web |
| -------------- | ------------------------------------: | -----------: |
| Section header |              `x=456 y=118 w=624 h=26` |        exact |
| Refresh        |              `x=1008 y=119 w=72 h=24` |        exact |
| Provider icon  |               `x=473 y=167 w=28 h=28` |        exact |
| Provider title |       `x=511 y=171 h=20`, `14/20/600` |        exact |
| Error status   |         `x=985.2 y=171.5 w=77.8 h=19` |        exact |
| Error detail   | `x=473 y=209 w=590 h=19.5`, `12/19.5` |        exact |
| Card 1         |            `x=456 y=150 w=624 h=95.5` |        exact |
| Card 2         |          `x=456 y=257.5 w=624 h=95.5` |        exact |
| Card 3         |            `x=456 y=365 w=624 h=95.5` |        exact |
| Footer         |        `x=456 y=466.5 w=624`, `11/18` |        exact |

## Evidence

- `usage-web-1280x820-light.png`: current Web authority.
- `usage-lynx-web-1280x820-light.png`: Lynx before the measured owner fixes.
- `usage-lynx-web-1280x820-light-final.png`: final current-bundle result.
- All PNGs are exactly `1280x820`.
- Both named browser sessions reported no page errors.
- The final Lynx client was online.

## Gates

- Focused Usage/Settings contract suite: 1 file, 6/6 passed.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with only the existing
  `color-scheme`, `overflow-wrap`, and optional `ws` native-module warnings.
- Web relay markers remain absent from the Native/Desktop bundle.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
