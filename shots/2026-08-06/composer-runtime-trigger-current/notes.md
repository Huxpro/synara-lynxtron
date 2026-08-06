# Composer Runtime trigger current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `cce6fdb1`.
- Current Web Full access trigger is `118.15625x28` with a transparent 1px
  border, 14px shield, 11px/16.5px/400 label, 12px chevron, 6px gaps, and
  `#e25505` light / `#fe8549` dark semantic accent.
- The previous Lynx trigger was generic 12px/normal/500 black Button text,
  lacked icon/chevron anatomy, and was 86px wide.
- Lynx now renders explicit permission-glyph/label/chevron anatomy inside the
  real MenuTrigger. A 14px diamond is the named Native glyph adaptation rather
  than a false claim of Web's shield icon. Geometry and light accent match Web.
- The first implementation used Button's `render` seam and generated five
  Native `cloneElement from compiled snapshot with children is not supported`
  warnings. That evidence was rejected. The final implementation contains no
  Button/render seam and the replacement Native console is empty.
- Web and Lynx-for-Web PNGs are `1280x820` with empty browser error logs.
- Focused picker contract: 1 file, 3/3 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `982417868c67796ffb1a3b39fea16b65cd67b9d7d0bb1f07e448bbba6e6096f2`,
  root PID `85026`, PID-derived `localhost:8904/session 1`. Native retained
  trigger/glyph/label/chevron at `118x28`, `14x14`, 11px/16.5px, and `12x12`;
  all use the full-access accent. Raw frame is `2560x1576` and warning/error
  console is empty.
