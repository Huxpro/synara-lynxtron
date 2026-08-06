# Sidebar Sort menu rhythm current-head fidelity

Status: retained current Electron and exact-owned Native evidence

- Source base: `a1f32da0`.
- The earlier Sort label slice corrected typography but did not retain reliable
  popup rhythm evidence. Current Electron CDP establishes the complete target:
  176x192 popup, 24px first label, 28px secondary label, five 26px items,
  4/4 label padding, and 8/4 secondary-label padding.
- The first exact-owned Native measurement exposed real remaining differences:
  176x226 popup, 32px items, and a 26px secondary label whose requested 8px top
  padding was overridden by the equally specific generic label rule.
- The correction is scoped to `.SharedSidebarProjectSortPopup`: 4px popup
  padding, zero minimum height, 26px items with 1px vertical padding, 16px
  label line-height, and a popup-qualified secondary-label selector.
- Focused section-header tests pass 4/4. Native/Desktop production build passes
  with only existing encoder and optional `ws` warnings.
- Exact-owned Native PID `28735` was resolved by `lsof` to
  `localhost:8903/session 1`. Supported touch opened the real menu without
  changing a selection.
- Final Electron and Native geometry are exact in every measured dimension:
  popup 176x192, labels 24/28, items 26/26/26/26/26. Native x coordinates are
  one pixel left solely because of the registered sidebar separator boundary.
  Native raw frame is 2560x1640; Electron CDP frame is 3456x2168 at DPR 2.
  Native warning/error console is empty.
- Cleanup: the menu state made no preference changes, the exact-owned Native
  process exited after capture, and unrelated Lynxtron clients were untouched.
