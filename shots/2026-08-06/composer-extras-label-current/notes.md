# Composer Extras label current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `0f16aadb`.
- Current Web Extras rows resolve to 12px/18px/400. The dedicated Lynx child
  `text` owner previously resolved to 12px/normal/400 with a 15px visual line
  box; the label wrapper's inherited 16px value was container noise.
- `.ComposerExtrasItemLabelLynx > text` now explicitly owns 12px/18px. The
  existing 26px main-row geometry is unchanged.
- Shared server `59690`, trusted origin `localhost:10391`, preserved snapshot,
  Light/Comfortable, and `1280x820` DPR 1. Web and Lynx-for-Web opened Extras
  through the rendered trigger; both PNGs are `1280x820` and both browser error
  logs are empty.
- Focused Extras suite: 1 file, 3/3 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `d90f71a32ec6e091cd13f9fbf96f4715375595e40baf1da8c409e5f9698a69bb`,
  root PID `42725`, PID-derived `localhost:8904/session 1`. A real touch opened
  Extras. Direct probes measured all three child `TEXT` nodes at 12px/18px
  with 18px boxes; DevTool serializes CSS weight 400 as equivalent `normal`.
  The retained raw frame is `2560x1576` and the warning/error console is empty.
