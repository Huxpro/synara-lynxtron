# Settings provider icon coverage

Status: retained Lynx-for-Web path and geometry evidence for Droid, Kilo, and
Pi provider identities.

## Residual

Web has canonical provider SVGs for all provider kinds. Lynx covered Codex,
Claude, Cursor, Antigravity, Grok, and OpenCode, but Droid, Kilo, and Pi fell
back to a visible first-letter glyph. In provider rows that produced:

- `DDroid`
- `KKilo`
- `PPi`

The fallback also used a different visual language from every other provider.

## Fix

- Added the Web-authoritative Droid, Kilo, and Pi SVG paths to the shared
  provider asset directory.
- Extended the central Lynx provider-icon map.
- All existing `OpenAIProviderIcon` consumers now receive the canonical
  provider glyphs; no Settings-only hiding rule was added.

## Evidence

At `1280x820`, comfortable density:

- Droid, Kilo, and Pi render `14x14` SVGs;
- viewBoxes are respectively `0 0 67 65`, `0 0 100 100`, and
  `0 0 800 800`;
- each identity contains zero `SettingsProviderToolsFallback` nodes;
- provider text is now `Droid`, `Kilo`, and `Pi` with no duplicated initials;
- connection diagnostics are empty.

The retained screenshot is `lynx-web.png`.

## Verification

- Focused provider tests: 2 files, 5 tests passed.
- Lynx-for-Web production build passed.
- Native/Desktop production build and Sharp runtime staging passed.
- Uncached changed-lines React Doctor against `3d5ff02d`, including the new
  test and SVG imports, reported zero diagnostics.
