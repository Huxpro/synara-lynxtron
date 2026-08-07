# Responsive Kanban column evidence

- The real 900x650 board exposed a concrete overflow: route-owned column hosts
  were 196px wide, but each shared column root retained a 256px minimum. Native
  scrollers therefore extended to x944 and the populated card to x940, 40-44px
  beyond the 900px window.
- The fix keeps the existing three-column desktop board and each column's
  vertical scroll ownership. Column roots, scrollers, and card lists now use
  `width: 100%; min-width: 0`, so the route host owns the available width.
- Final 900x650: all three roots/scrollers are 196px at x272..468, x480..676,
  and x688..884. The populated card ends at x880; no board content crosses the
  900px viewport.
- Final 1024x700: all three scrollers are 237.33px and the rightmost ends at
  x1009. Final 1440x900: all three scrollers are 376px and the rightmost ends at
  x1424. Wide geometry therefore expands naturally rather than staying fixed.
- All cells use real service-backed projects/tasks and the rendered project
  header navigation path. No fixture or SQLite write was used. Warning/error
  console output is empty.
