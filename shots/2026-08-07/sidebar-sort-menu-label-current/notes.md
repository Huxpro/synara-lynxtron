# Sidebar Sort menu label current-head fidelity

Status: retained exact-owned Native menu evidence plus Web ProjectSortMenu
source authority

- Source base: `40d5cdad`.
- Web Projects Sort group labels use `12px/18px/500`; option text uses
  `12px/18px/400`.
- The newly exposed Lynx Sort menu already matched option text but inherited
  generic group labels at `10px`, implicit line-height, and weight 400.
- `.SharedSidebarProjectSortPopup .LxMenuGroupLabel` now owns the Web
  `12px/18px/500` identity without changing other menu consumers.
- Focused section-header suite: 1 file, 4/4 tests. Configured Lynx-for-Web and
  Native/Desktop production builds pass with only existing warnings.
- Exact-owned Native bundle
  `ca0507409c618b861e961a337c42bad2d38b99389df69a287a2f7bccb07323da`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8901/session 1`.
- Supported Native touch opened the real menu. Group labels directly measure
  `12px/18px/500` in an 18px box; option text remains `12px/18px/400`.
  Raw frame is `2560x1576` and warning/error console is empty.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
