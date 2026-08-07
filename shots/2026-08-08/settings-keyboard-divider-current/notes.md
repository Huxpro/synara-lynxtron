# Settings Keyboard Shortcuts divider rhythm

Status: retained Lynx-for-Web geometry evidence for the Keyboard Shortcuts
header and row divider ownership.

## Residual

The card and row outer boxes already matched Web, but their internal content
was shifted:

- Web header: 11px / 16.5px text plus a 1px bottom divider.
- Lynx header: 11px / 17.5px text with no divider.
- Web rows own their 1px bottom divider.
- Lynx rows owned a 1px top divider.

Those compensating differences preserved the same outer heights while moving
the first row title 1px down.

## Fix

- Header line-height is now 16.5px.
- Header owns the bottom divider.
- Rows own bottom dividers instead of top dividers.
- The last row removes its bottom divider.

No row height, padding, or local position offset was changed.

## Evidence

At `1280x820`, comfortable density:

- header: `457,163,622x33.5`;
- header text: `469,171,54.296875x16.5`;
- header borders: top `0`, bottom `1`;
- first row: `457,196.5,622x59`;
- first title: `469,206.5,538x18`, exact with Web;
- row borders: top `0`, bottom `1`;
- final row bottom border: `0`;
- connection diagnostics: empty.

The retained screenshot is `lynx-web.png` at `1280x820`.

## Verification

- Focused Rstest: 1/1 passed.
- Lynx-for-Web production build passed.
- Native/Desktop production build and Sharp runtime staging passed.
- Uncached changed-lines React Doctor against `b5c50ebc`, including the new
  test, reported zero diagnostics.
