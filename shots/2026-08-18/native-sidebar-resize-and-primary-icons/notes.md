# Native Sidebar Resize And Primary Icons

## Sidebar resize recheck

The user-preview report said the visible Sidebar resize handle did not resize.
Current source and the current pinned Lynxtron runtime were rechecked instead
of assuming the earlier completion report was still valid.

Exact-owned identity:

- Native PID: `15675`;
- PID-derived DevTool client: `localhost:8903`, session `1`;
- runtime: `@lynx-js/lynxtron@0.0.12-dev`;
- bundle:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- endpoint: the owned PID held the connection to the user-preview server on
  `127.0.0.1:58090`.

Resolved resize result:

- sash: `10x820 @ (249,0)`, with complete mouse/touch bindings;
- press at `(254,400)` mounted the `1280x820` resize overlay;
- move to `(330,400)` changed `SidebarDisclosure` from `256px` to `332px`;
- release removed the overlay;
- `chat_thread_sidebar_width` persisted as `332`.

The current product/runtime path therefore works end to end. The user's earlier
window was a stale preview/bundle instance, not a remaining source defect. No
speculative resize code was added.

## Primary icon root cause

The four incorrect Sidebar glyphs were not failing Native SVG elements:

- New thread;
- Search;
- Kanban;
- Automations.

They were still rendering the Web `CentralIcon` implementation as HTML-like
`span` nodes with CSS `mask-image`. Lynx does not support that Web mask path.
Pull requests already used a Native `<svg content>` adapter and rendered
correctly.

## Fix

- Shared `SidebarPrimarySurfaceNavigation` now accepts an optional renderer
  icon set while keeping Web Central icons as its default.
- Lynx injects the exact Central SVG artwork for
  `compose-pencil`, `magnifying-glass`, `columns-3-wide`, and `clock`.
- The Lynx adapter raw-imports each asset and colorizes it with the active
  theme ink before rendering `<svg content>`.
- Item order, labels, shortcuts, badges, active state, disabled state, and
  callbacks remain in the one shared composition.

## Exact Native result

Final bundle SHA-256:

`6b70150c18624a26b4e2410b3f62a6cd3eacfd33a5482edcd354dad8868575f8`

The exact-owned Native DOM contained all five primary navigation labels and:

- `centralMaskSpanCount = 0`;
- `maskImageCount = 0`;
- exact Central path for compose-pencil: present;
- exact Central path for magnifying-glass: present;
- exact Central path for columns-3-wide: present;
- exact Central path for clock: present;
- Native warning/error console: empty.

## Verification and cleanup

- Focused Lynx tests: `2 files / 6 tests`.
- Web Sidebar import smoke: `1 file / 1 test`.
- Native/Desktop production build: passed with existing registered warnings.
- No screenshot was retained; repository screenshot count remained `100`.
- Default `kv.json` and `window-state.json` were backed up before each Native
  launch and restored byte-exact after the owned process exited.
- Entry/exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
