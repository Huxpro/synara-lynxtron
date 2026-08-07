# Composer runtime chevron

Status: retained Web/Lynx-for-Web geometry and exact-owned Native paint proof.

## Residual

After the permission shield converged, the adjacent control affordance still
used different icon systems:

- Web: Tabler `chevron-down`, 12x12, stroke width 2, opacity 0.7;
- Lynx: Unicode `⌄` in a 10px text box.

The boxes happened to match, but glyph shape, baseline, and rendering were not
the same.

## Fix

The Lynx runtime trigger now consumes the already-generated
`ChevronDownIcon` from `icons.lynx.tsx`. It uses the same 12x12 slot and the
same permission color as the shield and label. Text-only font, line-height,
alignment, and redundant CSS color owners were removed.

No new icon asset was added; the generated icon is the existing Tabler
`chevron-down` used elsewhere in the Lynx client.

## Browser evidence

The existing clean Web authority measures:

- trigger `118.15625x28`;
- shield relative `11,7`, `14x14`;
- label relative `31,5.75`, `58.15625x16.5`;
- chevron relative `95.15625,8`, `12x12`, opacity 0.7.

Final Lynx-for-Web preserves each measurement exactly. The chevron is an SVG
whose content contains class `icon-tabler-chevron-down`, canonical path
`M6 9l6 6l6 -6`, stroke `#e25505`, and no Unicode text.

As in the preceding Composer shield evidence, bundle reload displays the real
provider-status banner in the Lynx-for-Web frame. It changes absolute Composer
Y but not the trigger-relative geometry used for this icon comparison.

## Native evidence

- Production bundle:
  `7b8e47a2a1f3a433cb544019eac3405e1bd2fd8bc9202783ca8ffa3f28bedf56`.
- Snapshot online backup:
  `75a25334f8b924c4d8e14d74620955b004853cfe9a0dbef1e92cbcbcca366bee`.
- Owned launch root/child: `48309 -> 48319`.
- PID-derived DevTool target: `localhost:8901/session 1`.
- Session URL points to the exact staged Synara bundle.
- Trigger: `439,521,118x28`.
- Shield: `450,528,14x14`.
- Label: `470,527,58x17`.
- Chevron: `534,529,12x12`, relative `95,8`, opacity 0.7.
- DOM contains the canonical Tabler path and orange stroke; no `⌄` text
  remains.
- Warning/error console: empty.

Focused Composer tests pass 4/4. Lynx-for-Web and Native/Desktop production
builds pass with only the existing encoder and optional `ws` warnings.
