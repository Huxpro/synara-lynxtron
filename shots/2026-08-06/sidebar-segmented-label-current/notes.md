# Sidebar segmented label current-head fidelity

Status: retained Web/Lynx-for-Web evidence and exact-owned Native numeric/runtime
evidence

- Source base: `69dd5262`.
- Current Web segmented buttons are `21.25px` high with explicit 2px top/bottom
  label insets. Labels use `11.5px/17.25px/500`.
- Before this slice, Lynx buttons were 23px high with 3.5px label insets and
  labels used `11.5px/16px/500`.
- Lynx track, button, and label now use the Web vertical metrics:
  `27.25px`, `21.25px`, and `17.25px` respectively.
- Current Web and Lynx-for-Web both place labels at y=55 with 2px top/bottom
  button insets. Projects and Studio both resolve to exact button height and
  `11.5px/17.25px/500`; active-edge translations remain +4px / -4px.
- Web evidence comes from a healthy existing session with an empty page-error
  log. A fresh Web session produced a real provider socket error and its frame
  was rejected rather than retained. Final Web and Lynx-for-Web frames are
  `1280x820`; Lynx errors are empty.
- Focused segmented chrome suite: 1 file, 1/1 test. Configured Lynx-for-Web and
  Native/Desktop production builds pass with only existing encoder and optional
  `ws` warnings.
- Exact-owned Native bundle
  `41109f788235c963e9a8f6badd70d3dc528bf30a336dbaa007cde6dd9d05c160`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8904/session 1`.
- Native directly measures the active button at `113x21.25` and computes its
  label as `11.5px/17.25px/500`. The label box rounds to 18px in DevTool while
  its computed line-height remains the exact fractional value. Warning/error
  console is empty.
- Native screenshot capture was rejected because the non-raised window emitted
  no screencast frame within the timeout. It was not raised or retried in a
  loop; no Native frame is claimed for this slice.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
