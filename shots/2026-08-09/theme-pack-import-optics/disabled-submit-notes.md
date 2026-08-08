# Theme Pack Import disabled submit

- Web shared Button disabled opacity: `0.64`.
- Generic Lynx Button disabled opacity: `0.48`.
- The Theme Pack Import submit now owns a local `0.64` override; unrelated
  Lynx buttons remain unchanged.
- Resolved light/dark opacity: `0.64`.
- Geometry remains `788.734375,490.25,58.265625x28`.
- Exact button-region comparison:
  - light changed ratio `86.34% → 31.83%`, mean max-channel difference
    `50.18 → 31.54`;
  - dark changed ratio `86.34% → 31.72%`, mean max-channel difference
    `46.37 → 28.27`.
- Remaining pixels are dominated by glyph rasterization and alpha compositing,
  not an uncovered disabled-opacity or geometry mismatch.
