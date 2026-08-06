# Composer model row text current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `1fd38729`.
- Current Web Claude model rows resolve to 12px/18px/400. The dedicated Lynx
  model name previously resolved to 11px/normal/400 with a 13px visual box.
- `.ComposerModelOptionNameLynx` now explicitly owns 12px/18px. Existing Web
  26px and Lynx 30px rows remain their respective layout/touch-target
  contracts.
- Shared server `59690`, trusted origin `localhost:10391`, preserved snapshot,
  Light/Comfortable, and `1280x820` DPR 1. Both clients entered the Claude
  model list through rendered Model and Claude controls. All eight names
  resolve to 12px/18px/400; both PNGs are `1280x820` and browser errors empty.
- Focused picker contract: 1 file, 3/3 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `7514d56792e549aa7cc515272d6218056ca89ff1b7cc12c6d68057929b3da37b`,
  root PID `51936`, PID-derived `localhost:8905/session 1`. Real Model→Claude
  touches retained popup/model-row/name roles. Native measured the name at
  12px/18px with an 18px box, row at `248x30`, raw frame at `2560x1576`, and
  warning/error console empty.
- The current Claude catalog has no rendered cost multiplier, favourite, or
  collapsible group header, so those owners were not changed from source-only
  inference.
