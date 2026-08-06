# Sidebar segmented thumb current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `287a6e1e`.
- Current Web Projects-active thumb is `121x28.25` inside a `232x27.25`
  track. Before this slice, Lynx rendered the active thumb as a `2x29`
  vertical sliver inside its `231x27` track.
- Root cause was shared geometry output that used nested `calc()`,
  multiplication, division, and rem arithmetic. Browsers resolved it, but the
  Lynx CSS parser dropped the dynamic left/width values.
- `resolveSidebarSegmentGeometry()` now emits flat percent-plus-pixel lengths
  with bounded precision. The two-segment Projects state resolves to
  `left: 50%`, `width: calc(50% + 6px)`; Studio resolves to `left: -6px`,
  the same width, and `-4px` label translation.
- Web production geometry remains unchanged: Projects thumb `121x28.25`;
  real Studio button activation yields `121x28.25`, left `-6px`, and label
  translation `-4px`.
- Lynx-for-Web now resolves Projects to `121.5x29` instead of 2px. A real
  Studio segment activation resolves the same `121.5x29`, left `-6px`, and
  label translation `-4px`. Both frames are `1280x820` and browser errors are
  empty.
- Shared geometry tests cover both two-segment edges, a three-segment middle,
  invalid-index clamping, and pending-selection semantics: 1 file, 3/3 tests.
  Existing Lynx focused suites remain 2 files, 6/6 tests.
- Web, Lynx-for-Web, and Native/Desktop production builds pass. Existing Web
  chunk-size, Lynx encoder, and optional `ws` warnings are unchanged.
- Exact-owned Native bundle
  `2598ef8113f6b8d1ee7a44c4512047a7b49c5b385c6d3b25da3bd7ce5a3811fc`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8902/session 1`.
- Native Projects-active thumb directly measures a 122px border box and 120px
  content box at `left: 50%`, proving the 2px collapse is gone. The raw frame
  is `2560x1576` and warning/error console is empty. Compound VIEW radius
  remains subject to the registered DevTool zero-value boundary.
- The same audit found that Lynx does not pass Projects header Sort/Add
  actions. Those require shared controller extraction; this slice does not
  hide that functional gap with inert or approximate buttons.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
