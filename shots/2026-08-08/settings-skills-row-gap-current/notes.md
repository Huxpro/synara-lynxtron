# Settings Skills row width

Status: retained Lynx-for-Web geometry evidence for the shared Skills list.

## Residual

The first anchors matched, but the complete Shared skills section was 36px
taller in Lynx (`14202px` vs Web `14166px`). The row shell and metadata rhythm
were already correct.

The actual owner was the horizontal gap between row copy and control:

- Web: `10px`;
- Lynx: `20px`.

The narrower text column caused additional wrapping in a subset of the 115
skill descriptions, accumulating 36px downstream.

## Fix

`.SettingsSkillsMain` now uses `gap: 10px`. No row height, text line-height, or
section offset was changed.

## Evidence

After rebuild:

- Shared skills section: `456,300.5,624x14166`, exact with Web;
- main gap: `10px`;
- first five row heights: `123.5`, `213.5`, `159.5`, `123.5`, `141.5`,
  all exact with Web;
- connection diagnostics: empty.

The retained screenshot is `lynx-web.png`.

## Verification

- Focused Skills Rstest: 1 file, 3 tests passed.
- Lynx-for-Web production build passed.
- Native/Desktop production build and Sharp runtime staging passed.
- Uncached changed-lines React Doctor against `147cf5b7` reported zero
  diagnostics.
