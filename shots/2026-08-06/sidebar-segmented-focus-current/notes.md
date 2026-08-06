# Sidebar segmented focus current-head fidelity

Status: retained Web/Lynx-for-Web keyboard evidence and exact-owned Native
numeric/runtime evidence

- Source base: `71901305`.
- Current Web keyboard focus keeps the segmented button at `113x21.25`, with
  zero border/box-shadow and only the platform one-pixel auto outline.
- Before this slice, Lynx `ui-focus` added a one-pixel layout border while the
  browser also painted its default outline. The button widened from 113px to
  114px and showed a doubled focus seam.
- The custom Lynx focus border was removed. Platform focus indication now owns
  the ring, matching Web without changing control geometry.
- Real Tab traversal in Lynx-for-Web publishes `ui-focus` /
  `:focus-visible`; the focused Studio button remains exactly `113x21.25`,
  border 0, box-shadow none, and uses the platform one-pixel auto outline.
  Current Web measures the same geometry and ownership.
- Web and Lynx-for-Web frames are `1280x820`; both page-error logs are empty.
- Focused segmented chrome suite: 1 file, 1/1 test. Configured Lynx-for-Web and
  Native/Desktop production builds pass with only existing encoder/optional
  `ws` warnings.
- Exact-owned Native bundle
  `d4ab19a7b82f5850392d018f8b5afb825396e3b1b84972dac4c56256b7f277e0`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8902/session 1`.
- Native default button measures `113x21.25`, border 0, and no box-shadow.
  Warning/error console is empty. Native focused visuals are not claimed
  because this DevTool target does not expose a retained keyboard-focus command.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
