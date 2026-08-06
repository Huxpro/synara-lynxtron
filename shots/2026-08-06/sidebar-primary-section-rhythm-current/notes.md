# Sidebar primary section rhythm current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `0f8ebb9b`.
- Current Web places the Projects section header 16px after the bottom of the
  Automations row. The primary group has 6px bottom padding and no divider.
- Before this slice, Lynx placed Projects 20px after Automations because the
  primary group had 9px bottom padding plus a 1px bottom divider.
- `.AppSidebarPrimaryNav` now uses `padding: 0 6px 6px`, keeps its existing 4px
  external margin, and no longer paints the extra divider.
- Current Web and Lynx-for-Web both resolve the visual
  Automations-bottom-to-Projects-top pitch to exactly 16px. Web splits the
  pitch as 6px group tail plus 10px following ownership; Lynx splits it as
  8px plus 8px because the custom group and section-header margin boxes differ.
  The visible total pitch is the fidelity contract, so no anonymous offsets
  were added to force internal boxes to match.
- Web and Lynx-for-Web frames are `1280x820`; browser error logs are empty.
- Focused suites: 2 files, 6/6 tests. Configured Lynx-for-Web and
  Native/Desktop production builds pass with only existing encoder and
  optional `ws` warnings.
- Exact-owned Native bundle
  `87db0d929fc214cab33324e3142fabbfbb53bfa02c6faea57e5888f7d478af8d`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8904/session 1`; raw frame is
  `2560x1576` and warning/error console is empty.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
