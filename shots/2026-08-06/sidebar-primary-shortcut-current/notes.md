# Sidebar primary shortcut current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `22c83931`.
- Current Web New thread and Search trailing shortcuts each resolve to a
  `44x20` group with two `20x20` key pills, a `4px` gap, and an `8px` row-right
  inset. Each key uses `12px/16px/500`, radius `4px`, muted foreground, and
  muted background.
- Before this slice, Lynx omitted the New thread shortcut entirely and rendered
  Search as one joined `⌘K` text node at `10px`.
- `Sidebar.lynx.tsx` now projects both labels from
  `LYNX_PRIMARY_SHORTCUT_LABELS`; the same source also replaces the duplicate
  `⌘N` in the Lynx search palette.
- The Lynx adapter now renders one key node per shortcut part. Current
  Lynx-for-Web measurements are exact for both actions: group `44x20`, keys
  `20x20`, gap `4px`, right inset `8px`, typography `12px/16px/500`, radius
  `4px`, light muted background `rgba(13,13,13,0.04)`, and foreground
  `rgba(13,13,13,0.596)`.
- Web and Lynx-for-Web frames are `1280x820`; browser error logs are empty.
  The Lynx-for-Web initialization warning is the named upstream web-host
  warning and is not used as retained runtime-console proof.
- Focused shortcut suite: 1 file, 2/2 tests. Configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Exact-owned Native bundle
  `3ad253030f7b2921fd2ca70e8a96805955d024ccacf60c51384761b36468cc28`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8902/session 1`; no remembered DevTool
  endpoint was used.
- Native retained two shortcut groups, each `44x20`, with two `20x20` key
  nodes and a `4px` gap. Each key resolves to `12px/16px/500`; DevTool reports
  all four corner radii as `4px`. The raw frame is `2560x1576` and the
  warning/error console is empty.
- The isolated Native instance followed the system dark theme, so its frame is
  retained for Native structure, geometry, typography, and runtime-clean
  evidence only. Web and Lynx-for-Web light frames are the same-theme color
  comparison.
- Cleanup: the exact-owned root and child exited, PID-derived port `8902` was
  released, and unrelated Lynxtron clients on other ports were not touched.
