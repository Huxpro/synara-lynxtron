# Sidebar segmented chrome current-head fidelity

Status: retained Web dark, Lynx-for-Web light, and exact-owned Native dark
evidence

- Source base: `626ca99e`.
- Web owns a recessed 10px-radius segmented track and a raised 8px-radius
  selected thumb. Light uses an elevated-secondary track with a 6% inset
  shadow and a white/elevated thumb with a soft drop shadow/highlight; dark
  uses the app background with a 25% inset shadow and the composer surface
  with 16%/4% drop/highlight shadows.
- Before this slice, Lynx used 8px/7px radii, no track border or inset shadow,
  and no selected-thumb elevation.
- Lynx now uses the same 10px/8px radius hierarchy, theme-safe track/thumb
  surfaces, one-pixel semantic borders, and matching light/dark shadow
  strengths.
- The first material patch added borders without compensating the Lynx box
  model, shrinking the track/thumb to `231x27` / `120.5x27`. That intermediate
  evidence was rejected. The final track width and vertical thumb overhang
  compensate the hairlines without changing the shared segment math.
- Final Lynx-for-Web light resolves the track to `232x27`, radius 10, border
  1px, and the exact 6% inset shadow. The thumb resolves to `121x28`, radius 8,
  border 1px, and the exact 4%/50% light drop/highlight shadows. Browser errors
  are empty and the retained frame is `1280x820`.
- Current Web dark runtime remains the authority for dark material: track
  radius 10 with 25% inset shadow; thumb radius 8 with 16%/4% shadows. Its
  frame is `1280x820` and browser errors are empty. Cross-theme frames are not
  presented as a pixel pair.
- Focused Lynx chrome/host suites: 2 files, 4/4 tests. Configured
  Lynx-for-Web and Native/Desktop production builds pass with only existing
  encoder and optional `ws` warnings.
- Exact-owned Native bundle
  `3375ae3ddee3c5ac7a736341486c6ee712d0fd55256e67fbf51cbd559b8ea657`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8902/session 1`.
- Native dark directly resolves the track to background `rgb(16,16,16)` with
  the 25% inset shadow and the thumb to `rgb(23,23,23)` with 16%/4% shadows.
  Raw frame is `2560x1576` and warning/error console is empty. Numeric Native
  border/radius/outer geometry is not claimed because these compound VIEW
  properties retain the registered DevTool zero/content-box boundary.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
