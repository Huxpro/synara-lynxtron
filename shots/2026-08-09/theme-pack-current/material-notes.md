# Theme Pack current-head material

- Current-head paired frames use one isolated service and `1280x820` viewport.
- Web popup resolves:
  - light border `rgba(13,13,13,.06)`;
  - dark border `rgba(252,252,252,.047)`;
  - overflow visible;
  - theme-specific `0 16px 50px -12px` shadow.
- Lynx now resolves the same values instead of generic `--border` and clipped
  overflow.
- In the `480x290` popup-plus-shadow crop:
  - light changed ratio `8.92% → 8.31%`;
  - dark changed ratio `8.88% → 8.25%`.
- Largest bottom-shadow cluster:
  - light `900 → 490` pixels;
  - dark `818x2 → 412x1`.
- Remaining connected clusters are textarea edge rasterization and text
  glyphs, not unresolved popup border, surface, radius, overflow, or shadow
  values.
