# Theme Pack Import final dialog baseline

- Final retained frames: `lynx-light-final.png`, `lynx-dark-final.png`.
- Both frames are `1280x820`.
- Dialog geometry remains `416,288.75,448x242.5`.
- Cancel and Import resolve to the Web Dialog action radius `6px`.
- Final whole-dialog comparison:
  - light changed ratio `11.41%`, mean max-channel difference `6.37`;
  - dark changed ratio `11.30%`, mean max-channel difference `6.25`.
- The largest remaining connected clusters are the focused textarea's
  cross-element border rasterization and text glyphs. Source-level geometry,
  border ownership, focus color, padding, placeholder tone, title/description
  typography, code chip, close glyph, action radius, action weight, and
  disabled opacity are all explicitly matched.
