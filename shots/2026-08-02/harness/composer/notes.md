# Lynx-for-Web Composer fidelity slice

- Scope: paired empty-landing Composer at `1280×820`, DPR 1, light theme.
  Web original is the visual and interaction authority. Both clients used the
  same isolated Synara state at
  `/private/tmp/synara-lynx-web-harness.SUyxxH/synara-home/dev/state.sqlite`.
- Snapshot SHA-256:
  `01e429486e927df1e96accaf95444110f5e491d39a4c5afbd4757c4170e73e41`.
- Web bundle SHA-256:
  `ca8dba45f631983d24e22504792845be38769c6bd15ba21419087e61c21f1518`.
- Desktop/Lynx bundle SHA-256:
  `fb2dfbb2bfb1970a4d239e4d76b215cd176e92c239c0a39581f44e67f621508c`.

## Geometry

| Anchor           | Web original                       | Lynx for Web                    | Delta                             |
| ---------------- | ---------------------------------- | ------------------------------- | --------------------------------- |
| Composer surface | `x=400 y=421.75 w=736 h=95 r=19.2` | `x=408 y=429 w=736 h=95 r=19.2` | `x=+8 y=+7.25`; size/radius exact |
| Project tray     | `x=400 y=496.75 w=736 h=58`        | `x=408 y=504 w=736 h=58`        | `x=+8 y=+7.25`; size exact        |

The surface and tray meet the ≤8 px anchor contract. The shared Web landing
stack remains the composition owner; Lynx supplies only platform controls and
styles. The empty-landing placeholder, model/effort split, project tray,
surface radius, spacing, and control density now follow the Web state.

## Interaction proof

- Real provider model and effort controls open independently.
- Access and Extras menus render on-screen from their global anchors. The Web
  overlay layer is normalized to its nested Lynx viewport; Native keeps the
  zero-origin behavior.
- The project picker renders the persisted `Lynx Web Spike` project and changes
  the target used by first-send thread creation.
- Typing `$pol` queries `provider.listSkills` and renders the real provider
  catalog. Selecting `polish` inserts the provider-canonical `/polish` token,
  stores a structured skill reference, renders the skill chip, and carries the
  reference in the canonical message payload.
- The microphone affordance is present but explicitly disabled and named
  unavailable in Lynx for Web; browser evidence does not certify voice input.

## Evidence and residuals

- `web-light.png` / `lynx-light.png`: paired empty landing.
- `lynx-traits-open.png`: anchored traits menu.
- `lynx-skills-filtered.png`: real filtered skill catalog.
- `lynx-skill-chip.png`: selected skill chip and enabled send action.
- All PNGs are `1280×820`.
- Lynx for Web still exposes the canonical `/polish` text below the separate
  chip because its textarea is a platform island; exact Web inline rich-token
  editing remains a registered fidelity residual.
- Runtime had no page errors. The only console warning was the upstream
  Lynx-for-Web initialization deprecation.

## Gates

- Focused tests: 6 files / 28 tests passed.
- Web production: `2476.6 kB` main bundle passed.
- Desktop production: `2379.6 kB` Lynx bundle / `2508.3 kB` total passed.
- `git diff --check` passed.
