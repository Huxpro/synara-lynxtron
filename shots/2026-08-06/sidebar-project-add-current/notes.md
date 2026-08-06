# Sidebar Projects Add action current-head fidelity

Status: retained Web authority, real Lynx-for-Web interaction, and exact-owned
Native structure/runtime evidence

- Source base: `18c67167`.
- Current Web Projects header has a hover/focus-revealed Add project action:
  20x20 button, 14x14 `plus-medium` central icon, 6px radius. The toolbar is
  opacity 0 / pointer-events none by default and opacity 1 / pointer-events
  auto on header hover.
- Lynx previously rendered no Projects header actions at all.
- Web and Lynx platform element adapters now expose the same
  `SidebarListSectionHeaderAddProjectElement` contract. Lynx uses the exact
  `plus-medium.svg` asset, real accessibility name, keyboard/touch activation,
  and the same 20x20 / 14x14 / 6px anatomy.
- Lynx reuses the existing `SidebarSearchPalette` filesystem browser and
  canonical `project.create` command path instead of duplicating folder/RPC
  logic. Header Add remounts the palette with initial query `~/`; ordinary
  Search remounts it with an empty query.
- Multiple intermediate Browser probes were rejected: non-focusable header
  events did not serialize into Web DOM, and the Lynx-for-Web engine kept an
  opacity transition at zero even after the hover class arrived. The final
  Web-only host bridge uses an explicit `LynxWebHoverOwner` class and the Lynx
  action uses immediate state reveal, preserving usability rather than an
  unreliable 150ms fade.
- Final fresh-session Lynx-for-Web evidence proves default hidden state,
  Projects header `ui-hover`, and a visible 20x20 action with 14x14 icon.
  Browser errors are empty.
- Real keyboard Tab traversal reaches the hidden Add action at `tabIndex=0`,
  publishes `ui-focus` / `:focus-visible`, and reveals it.
- No project-create command was submitted during evidence collection, avoiding
  mutation of the shared snapshot. Command construction and dispatch remain
  covered by the existing sidebar search action tests and the reused production
  path.
- Current Web authority confirms the same default/hover reveal and exact
  20x20/14x14 geometry. Web and Lynx-for-Web retained frames are 1280x820.
- Focused Lynx action/host suites: 2 files, 6/6 tests. Web, Lynx-for-Web, and
  Native/Desktop production builds pass with only existing build warnings.
- Exact-owned Native bundle
  `9186a8a8e03a8a96d7f82f5e1ff5fa86e1bf506f6890a013dbf72ffaca407c0a`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8902/session 1`.
- Native retains a 20x20 Add action with accessibility label, focusable button
  semantics, and complete mouse/touch/key/focus bindings. A supported
  `Input.emulateTouchFromMouseEvent` press/release at its measured center opens
  the production Command dialog; Native DOM records
  `default-value="~/"` and the real project-path placeholder. Raw open frame is
  2560x1576 and warning/error console is empty.
- Projects Sort remains a separate shared-controller workflow gap; this slice
  does not mask it with an inert menu.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
