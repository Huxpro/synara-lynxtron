# Composer Send action current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `407cd18e`.
- Current Web disabled Send action is a 28x28 circular primary control with a
  transparent 1px border, opacity 0.2, and a real 20x20 central arrow-up icon.
- The previous Lynx control used opacity 0.42 and a 17px/700 text arrow whose
  visible geometry was about 13.4x20.
- Lynx now imports `@synara-central-icons/arrow-up.svg?raw`, colors it from the
  active theme surface, and renders it at 20x20. The button owns the transparent
  border and Web's disabled opacity.
- Current Web and Lynx-for-Web match on button/icon geometry, fill, and opacity.
  Both PNGs are `1280x820` and browser error logs are empty.
- Focused picker contract: 1 file, 3/3 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `edc24d258cf9501d2bcddddc86214380abc62c721971dbb43e1f4974573bb182`,
  root PID `13040`, PID-derived `localhost:8904/session 1`. Native measured the
  disabled button at 28x28 with opacity 0.2 and the SVG at 20x20 with white
  arrow strokes. Raw frame is `2560x1576` and warning/error console is empty.
- Compound Native VIEW radius/border remains under the known DevTool zero-value
  boundary; numeric circle/border closure is claimed from source/test plus
  current Lynx-for-Web, not ambiguous Native computed values.
