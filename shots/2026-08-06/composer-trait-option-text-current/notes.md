# Composer Traits option text current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `2a9edb62`.
- Current Web Traits radio options resolve to 12px/18px/400. The dedicated
  Lynx label previously resolved to 12px/normal/400 with a 15px visual line
  box.
- `.ComposerTraitOptionLabelLynx` now explicitly owns 12px/18px. The existing
  34px Native row remains unchanged; Web rows remain 26px.
- Shared server `59690`, trusted origin `localhost:10391`, preserved snapshot,
  Light/Comfortable, and `1280x820` DPR 1. Web and Lynx-for-Web opened Traits
  through the rendered trigger. All four labels resolve to 12px/18px/400;
  both PNGs are `1280x820` and both browser error logs are empty.
- Focused trait-picker suite: 1 file, 2/2 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `7577d5c80f1c9dcee0eed2063bdbcf5f13bf78e00a6a2de5726b74593f7505ac`,
  root PID `87825`, PID-derived `localhost:8905/session 1`. A state-idempotent
  real touch opened Traits. Native measured the first label at 12px/18px with
  an 18px box and serializes CSS weight 400 as equivalent `normal`; the row is
  `240x34`, raw frame `2560x1576`, and warning/error console is empty.
