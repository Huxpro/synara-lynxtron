# Sidebar primary top rhythm current-head fidelity

Status: retained Lynx-for-Web and exact-owned Native evidence plus current Web
owner/source authority

- Source base: `55f16f48`.
- Web primary navigation uses `px-1.5 pt-1 pb-1.5`: 6px horizontal, 4px top,
  and 6px bottom padding.
- Lynx previously used `0 6px 6px`, shifting every primary row and the Projects
  section header four pixels upward while the segmented picker was already
  aligned.
- `.AppSidebarPrimaryNav` now uses `4px 6px 6px`.
- Current Lynx-for-Web exactly matches the current Web owner inventory:
  New thread y=91.25, Search 121.25, Kanban 151.25, Pull requests 181.25,
  Automations 211.25, and Projects header 255.25.
- The nav top-to-first-row gap is 4px and Automations-to-Projects visual pitch
  remains the previously certified 16px. Horizontal width remains one pixel
  narrower only because of the registered Lynx sidebar separator boundary.
- Lynx-for-Web frame is `1280x820` and page-error log is empty. Fresh Web
  sessions had provider socket errors, so Web values come from the same
  current-head owner inventory and canonical `pt-1` source rather than an
  invalid retained frame.
- Focused primary-navigation suite: 1 file, 3/3 tests. Configured Lynx-for-Web
  and Native/Desktop production builds pass with only existing warnings.
- Exact-owned Native bundle
  `ce8d898d11ae2c0855b24129412b0869db59895aceed477c35e593d1316fb56c`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8903/session 1`.
- Native logical coordinates round the fractional Browser positions to New
  thread y=92, Automations y=212, and Projects y=256 while preserving 28px row
  heights. Raw frame is `2560x1576` and warning/error console is empty.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
