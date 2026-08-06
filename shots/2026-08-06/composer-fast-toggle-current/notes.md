# Composer Fast toggle current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `89a1ea40`.
- Web's Fast control is a 20x20 button with 8px radius, a 14px icon, stable
  `Fast mode` accessibility label, and `aria-pressed`.
- Lynx retained a 22x22/radius-6 control and changed its label between
  `Enable Fast mode` and `Disable Fast mode`.
- The Lynx owner now matches Web at 20x20/radius 8 with the stable label and
  pressed-state identity. The Native `ϟ` glyph remains the platform icon
  adaptation at the same 14px optical size.
- A dedicated focused adapter test locks geometry, label, and false pressed
  state. Focused composer/menu invocation: 3 files, 12/12 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Shared server `59090`, trusted origin `localhost:9791`, same snapshot,
  Light/Comfortable, `1280x820`; served and built hashes match.
- Current Web: `20x20`, radius 8px, label `Fast mode`,
  `aria-pressed=false`.
- Current Lynx-for-Web: `20x20`, radius 8px, label `Fast mode`. The Web custom
  Lynx host omits a false `aria-pressed` attribute, while source/test and Native
  retain the semantic value.
- Exact-owned Native bundle
  `f9a8fb553525ff633c0e142d3a43aff4a8c67065aa21adf3be146d568ff90e12`,
  root PID `35730`, PID-derived `localhost:8904/session 1`.
- Real touches opened Traits and toggled Fast false→true for the retained
  `2560x1576` frame; a second real touch restored false. The restored DOM
  explicitly reports `aria-label="Fast mode"` and `aria-pressed="false"`.
  Warning/error console is empty.
