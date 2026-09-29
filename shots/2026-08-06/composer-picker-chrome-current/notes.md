# Composer picker shared chrome current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `3086435c`.
- Web Model, Traits, Runtime, and Extras popups all consume
  `ComposerPickerMenuPopup`, whose canonical chrome is 10.4px radius plus the
  Light 7% / Dark 30% composer shadow.
- Lynx had split owners:
  - Model used a private 16% `0 8 24` shadow;
  - Traits and Runtime inherited generic 10px/no-shadow menu chrome;
  - Extras had just been calibrated independently.
- One shared Lynx selector now owns the canonical light/dark radius and shadow
  for Model, Traits, Runtime, Extras, and the Extras Fast submenu. The private
  Model heavy shadow was removed.
- The Native opaque semantic popover remains the registered no-backdrop-filter
  correction.
- Focused test invocation resolved to 2 existing files / 11 tests
  (`ComposerExtrasMenuCompositionElements` and `menu.lynx`); nonexistent
  filename arguments were ignored by Rstest and are not counted as coverage.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Shared server `58890`, trusted origin `localhost:9591`, same snapshot,
  Light/Comfortable, `1280x820`; served and built hashes match.
- Current Web:
  - Model `208x244`, radius 10.4px, Light 7% shadow;
  - Traits `208x142`, same chrome.
- Current Lynx-for-Web:
  - Model `260x300`, radius 10.4px, Light 7% shadow;
  - Traits `260x188`, same chrome.
    Their content dimensions differ by the existing Native catalog/layout
    contract; this slice only closes material ownership.
- Exact-owned Native bundle
  `3d6a37e6cf49f9b4feed986a17b317c21e6a835452f4f725f99b3d32634993d6`,
  root PID `78889`, PID-derived `localhost:8904/session 1`. A real Model
  trigger touch retained popup/row roles, a `2560x1576` frame, and an empty
  warning/error console.
