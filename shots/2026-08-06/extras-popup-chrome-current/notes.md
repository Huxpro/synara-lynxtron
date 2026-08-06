# Composer Extras popup chrome current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `e73701b7`.
- Web's main Extras menu and Fast submenu both consume the canonical composer
  picker chrome: `10.4px` radius plus the restrained 7% composer shadow in
  Light and the 30% dark shadow.
- Lynx previously inherited the generic 10px/no-shadow menu shell. The main
  Extras popup and its independently positioned submenu now explicitly share
  the canonical radius and light/dark shadow recipe.
- The fill remains the semantic opaque Native popover. Web's 70% frosted fill
  depends on `backdrop-filter`, which Lynx does not support; applying alpha
  without blur would reduce readability and is retained as the registered
  engine correction.
- Focused Menu/Extras suites: 2 files, 11/11 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Shared server `58790`, trusted origin `localhost:9491`, same snapshot,
  Light/Comfortable, `1280x820`; served and built bundle hashes match.
- Web rendered interaction:
  - main popup `141.421875x106`, radius `10.4px`, 7% `0 4 18 -6` shadow;
  - Fast hover opens a `128x62` submenu with the same radius/shadow.
- Lynx-for-Web rendered interaction:
  - main popup `142x108`, radius `10.4px`, the same 7% shadow;
  - real Fast-row press opens a `128x64` submenu with the same chrome.
- The existing two-pixel main/submenu engine rhythm remains explicitly
  registered; this slice changes material only and does not force heights.
- Exact-owned Native bundle
  `37188e4828fb5a0d9f6f70d167a3db268f743bc8e4a27e6e673c276f4f4b6e75`,
  root PID `39774`, PID-derived `localhost:8903/session 1`. Real touches opened
  Extras and then Fast; root/main/sub/row roles, a `2560x1576` frame, and an
  empty warning/error console were retained.
- One helper invocation had a malformed `--root-pid39774` argument and exited
  before capture. No evidence was produced; the corrected helper-verified
  capture is the only retained Native artifact.
