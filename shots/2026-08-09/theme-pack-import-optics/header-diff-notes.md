# Theme Pack Import header diff

- Stable Web authority frames: `web-light.png`, `web-dark.png`.
- Final Lynx frames: `lynx-light-header-final.png`,
  `lynx-dark-header-final.png`.
- All frames are `1280x820`.
- Final geometry remains:
  - dialog `416,288.75,448x242.5`;
  - title `433,305.75,414x22.5`;
  - description `433,334.25,414x32`;
  - code token `477.734375,332.25,116x20`;
  - textarea `434,371.25,412x94`.
- Resolved Lynx header styles:
  - title foreground, weight 600, system UI family;
  - description muted foreground, weight 400;
  - code token `2px 4px`, radius 4, semantic muted surface, shared code font.
- Full-header mean max-channel difference:
  - light: `18.86 → 6.87`;
  - dark: `13.03 → 8.02`.
- Light title-only mean difference: `18.85 → 1.93`.
- Remaining header differences are primarily cross-engine glyph rasterization;
  no unresolved geometry, font size, line height, weight, color, padding,
  radius, or semantic-surface mismatch was found.
