# Composer permission shield icon

Status: retained Web/Lynx-for-Web geometry and exact-owned Native paint proof.

## Residual

Web's runtime permission trigger uses the canonical
`central-icons-reversed/shield-access.svg` at 14x14. Lynx used a 10px Unicode
diamond (`◆` / `◇`) inside the same nominal slot. The surrounding trigger,
label, color, and chevron had already converged, so the approximation remained
as a high-salience icon-shape residual.

## Fix

The Lynx runtime-mode adapter now imports the same shared asset through the
existing `@synara-central-icons` alias and colorizes it with the existing Lynx
SVG pipeline:

- full access: light `#e25505`, dark `#fe8549`;
- default permissions: active theme ink;
- icon box: 14x14, non-shrinking;
- no Unicode diamond fallback remains.

The asset is not copied or redrawn. The alias resolves directly to
`apps/web/public/central-icons-reversed/shield-access.svg`.

## Browser evidence

At `1280x820`, DPR 1, light, comfortable:

| Role    | Web                                 | Lynx-for-Web             |
| ------- | ----------------------------------- | ------------------------ |
| Trigger | `118.15625x28`                      | `118.15625x28`           |
| Shield  | `14x14`, relative `11,7`            | `14x14`, relative `11,7` |
| Label   | `58.15625x16.5`, relative `31,5.75` | same                     |
| Chevron | `12x12`, relative `95.15625,8`      | same                     |

The Lynx SVG content contains the canonical shield path beginning
`M3.75 7.07405` and resolves both stroke and fills to `#e25505`. The old glyph
class is absent. The trigger width remains unchanged.

The full Lynx-for-Web frame also contains the real provider-status banner after
bundle reload. That banner shifts the Composer's absolute Y position but does
not affect the trigger's internal relative geometry; the screenshot is not
used as a clean landing-position comparison.

## Native evidence

- Production bundle:
  `9d89fa33a4a1a111b4bbfe643078c01018d99dbaa511027b4f1096d074bab656`.
- Snapshot online backup:
  `d1250dfee6023e983df5a0ac4a3bd6c9fa26e05b109d962ade64b304e66887dd`.
- Owned launch root/child: `17253 -> 17258`.
- PID-derived DevTool target: `localhost:8902/session 1`.
- Session URL points to the exact staged Synara bundle.
- Composer: `400,461,736x95`.
- Trigger: `439,521,118x28`.
- Shield: `450,528,14x14`, relative `11,7`.
- Label: `470,527,58x17`.
- Chevron: `534,529,12x12`.
- DOM contains the canonical shield path and `#e25505`; the old glyph class is
  absent.
- Warning/error console: empty.

Focused Composer tests pass 4/4. Lynx-for-Web and Native/Desktop production
builds pass with only the existing encoder and optional `ws` warnings.
