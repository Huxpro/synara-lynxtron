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
- The paired menu also exposed stale shared copy: Electron's current labels
  are `Last user message` / `Created at`, while the extracted catalog still
  said `Recent activity` / `Date added` / `Date created`. The shared catalog
  now owns the current copy, and the Web monolith consumes that catalog instead
  of maintaining duplicate local maps. Sort values and persistence semantics
  are unchanged.
- Final exact-owned Native DOM publishes the same five option labels as
  Electron, retains the exact geometry above, and has an empty console.
- Material comparison found one final scoped optics fork. Electron uses a
  10.4px picker radius and light/dark 4px/6px elevation. The Native menu still
  inherited the generic 10px shell without a scoped elevation.
- The Sort popup now reuses the already validated picker radius and matching
  light/dark shadow strengths. Lynx keeps its opaque theme-safe popover
  background because backdrop-blurred oklab translucency is not a supported
  Native contract.
- Exact-owned final bundle ran under PID `2648`, PID-derived
  `localhost:8905/session 1`; the real menu frame is 2560x1640 and console is
  empty. Compound popup DevTool still reports zero radius/border, so source
  ownership and the retained frame are the evidence; no false numeric Native
  radius claim is made.
- Cleanup: the menu state made no preference changes, the exact-owned Native
  process exited after capture, and unrelated Lynxtron clients were untouched.
