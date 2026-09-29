# Composer picker row current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `77bcea64`.
- Web composer picker options share an 8px option radius; collapsible group
  headers and nested favourite controls use the 10.4px panel radius.
- Lynx still had private 7px provider, trait, and model rows, no explicit
  group-header radius, and a 6px favourite control.
- The Lynx owners now match the shared roles:
  - provider / trait / model rows: 8px;
  - model group header / favourite control: 10.4px.
- Skeleton dots/lines retain their 7px capsule radius and were not conflated
  with interactive options.
- Focused Menu/Extras invocation: 2 files, 11/11 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Shared server `58990`, trusted origin `localhost:9691`, same snapshot,
  Light/Comfortable, `1280x820`; served and built hashes match.
- Current Web:
  - provider rows `198x26`, radius 8px;
  - trait rows `198x26`, radius 8px.
- Current Lynx-for-Web:
  - provider row `248x32`, radius 8px;
  - model row `248x30`, radius 8px;
  - trait row `240x34`, radius 8px.
    Content dimensions retain the existing Native density/catalog contract.
- The current Claude model list had no collapsible group or favourite control,
  so their 10.4px values are source/test evidence only and are not presented as
  runtime proof.
- Exact-owned Native bundle
  `506762d9f130bbd39a92ff4036ee51321d590127120ebd81e4eb780cfe1ab595`,
  root PID `5242`, PID-derived `localhost:8903/session 1`. A real Model trigger
  touch retained popup/provider roles, a `2560x1576` frame, and an empty
  warning/error console.
