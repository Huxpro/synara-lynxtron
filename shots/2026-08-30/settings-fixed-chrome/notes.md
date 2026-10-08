# Settings fixed chrome verification

- Route: Electron `#/settings?section=advanced`; Native `synara://settings/advanced`.
- Shared backend: `49369`; light theme; logical window size `864x620` (the macOS runtime clamps the requested 500px height to its 620px minimum).
- Exact-owned windows: Electron PID/window `83977/15987`; Native PID/window `85791/15995`.
- Search state: real query `e`, producing the same ranked settings-result surface.
- Electron CDP: inner result scroller `scrollTop 0 -> 228`, `scrollHeight 700`, `clientHeight 472`; Back stayed at `y=52`, Search stayed at `y=95.5`.
- Electron captures: `electron-search-top.png` and `electron-search-bottom.png`, each `1728x1240` at DPR 2.
- Native Computer Use: real drag moved the result list from the first result (`Editor`) to the middle (`New threads`) while Back/Search remained at approximately `y=68/108`.
- Native retained crop: `lynx-search-bottom.png` / `lynx-search-bottom-sidebar.png`. It was captured from exact window `15995` and normalized to the 1728x1240 content size; macOS window-shadow pixels were excluded.
- Search placeholder alignment: Native uses a 26px one-line textarea, 16px line-height, and symmetric 5px vertical padding inside the shared 28px search shell; the exact-owned frame shows the text baseline centered with the 14px icon.
- Harness residual: the owned Native process did not register a DevTool client. Later Computer Use calls remapped the same app path/window request to unrelated PID `37522`; those calls were rejected and no resulting frames count as evidence.
