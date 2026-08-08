# Theme Pack Import textarea control

- Web paint ownership:
  - outer control `433,370.25,414x96`;
  - inner textarea `434,371.25,412x94`;
  - outer focused border foreground/30;
  - inner padding `7px 9px`.
- Final Lynx paint ownership is exact:
  - `SharedThemePackImportTextareaControl` owns the `414x96` border/radius;
  - inner `x-textarea` is `412x94`, borderless, with `7px 9px` padding;
  - `bindfocus` / `bindblur` toggle the outer focused class;
  - light/dark focused borders resolve to the corresponding foreground/30.
- Dialog geometry remains `416,288.75,448x242.5`.
- Exact textarea-region comparison:
  - light changed ratio `9.95% → 9.32%`, mean difference `6.57 → 6.07`;
  - dark changed ratio `9.96% → 9.35%`, mean difference `6.72 → 6.17`.
- Remaining pixels are dominated by textarea glyph/caret rasterization rather
  than border ownership, padding, radius, focus color, or geometry.
