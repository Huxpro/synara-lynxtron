# Settings sidebar short-window evidence

- Web authority gives the complete Settings sidebar content one ScrollArea.
  Lynx previously left normal navigation in a plain view and only made search
  results scrollable, so scroll ownership differed by state.
- At the desktop minimum 900x650, the old navigation was already at its limit:
  Advanced ended at y642 inside a body ending at y650, leaving 8px.
- The 46px titlebar remains fixed. `SettingsSidebarBody` is now the sole vertical
  scroll-view for Back, Search, navigation, and search results; results are a
  plain view to avoid nested scrolling.
- Exact-owned Native geometry:
  - 650 high: body y46..650 / 604px, inner 592px, Advanced y614..642.
  - 820 high: body 774px, inner 762px.
  - 900 high: body 854px, inner 842px.
- Main Settings content remains a separate vertical scroll owner. All retained
  cells use the real service-backed Settings state and have empty warning/error
  consoles.
