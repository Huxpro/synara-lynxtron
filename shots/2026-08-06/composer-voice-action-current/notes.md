# Composer Voice action current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `554e7965`.
- Current Web Voice action is enabled; Lynx voice recording remains
  unavailable. The capability delta is preserved honestly: Lynx is disabled,
  non-focusable, explicitly labeled unavailable, and opacity 0.48.
- Common anatomy now matches Web at 28x28, radius 8, transparent border, and a
  real 16x16 central microphone. The previous Lynx button was 32x28 and its
  Web-mask span visibly shrank to 14x16.
- Lynx imports `@synara-central-icons/microphone.svg?raw`, colors it with the
  active theme's muted foreground, and renders it in a plain disabled view.
- The first raw-SVG implementation kept Button's `render` seam and generated
  three Native cloneElement warnings. That evidence was rejected. The final
  implementation removes Button/render and the replacement console is empty.
- Web and Lynx-for-Web PNGs are `1280x820` with empty browser error logs.
- Focused picker contract: 1 file, 3/3 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `c4f9f5723a90554438cd06652062eefe2d874e6f1e62700373144eafe8a3069e`,
  root PID `63842`, PID-derived `localhost:8904/session 1`. Native retained the
  disabled/non-focusable button at 28x28 and microphone at 16x16 with muted
  stroke. Raw frame is `2560x1576` and warning/error console is empty.
