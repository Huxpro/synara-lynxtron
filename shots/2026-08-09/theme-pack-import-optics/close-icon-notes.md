# Theme Pack Import close icon

- Geometry remains `833,303.75,16x16`.
- The generated Lynx icon consumes its `color` prop, not CSS `color` on the
  outer SVG host.
- Final runtime values:
  - light SVG stroke `rgba(13,13,13,.6)`;
  - dark SVG stroke `rgba(252,252,252,.6)`;
  - outer icon opacity `0.8`.
- Exact `18x18` close crop:
  - light changed ratio `16.05% → 0%`, mean difference `12.56 → 0.16`;
  - dark changed ratio `16.05% → 4.94%`, mean difference `12.16 → 0.42`;
  - final pixels have no max-channel difference above 16.
