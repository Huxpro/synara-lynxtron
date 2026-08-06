# Sidebar segmented pressed state current-head fidelity

Status: retained Web/Lynx-for-Web pointer evidence plus exact-owned Native
bundle/runtime evidence

- Source base: `3214442a`.
- Current Web keeps a pressed segmented button transparent at opacity 1; the
  selected thumb remains the visual selection feedback.
- Before this slice, Lynx `ui-pressed` painted `var(--accent)`, producing a
  prominent light-blue block over the segmented material.
- The custom pressed background was removed.
- Real pointer-down now leaves both Web and Lynx-for-Web transparent with no
  box-shadow and opacity 1. Lynx still publishes `ui-pressed`; pointer-up clears
  it and completes the real Studio selection.
- Retained Web and Lynx-for-Web frames are `1280x820`; page-error logs are
  empty.
- Focused segmented chrome suite: 1 file, 1/1 test. Configured Lynx-for-Web and
  Native/Desktop production builds pass with only existing warnings.
- Exact-owned Native bundle
  `cb21675cf17631eb7ca93610f3d44da21044b3746facf7f44be19c6012e84014`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8902/session 1`; warning/error console is
  empty.
- Native pressed visuals are not claimed because retaining the transient frame
  would require timing-sensitive pointer capture. The real Lynx interaction
  contract and Browser pointer lifecycle cover class publication and release.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
