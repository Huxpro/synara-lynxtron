# Current-head Providers dark / 1440 matrix

## Identity

- Source commit: `99d854beb2a67eea5da4ab01a77967e46ecfc761`.
- Shared server: owned `127.0.0.1:60462`.
- Shared SQLite snapshot:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Lynx-for-Web bundle:
  `52b92766573497209b59db06104c536f23ceb8a177bf09a6bcaca942094a7c5b`.
- Native online certification bundle:
  `98083afbc10c3f6891fabcfa9b59db9d2274619a9d1b8046ea39be42a22bd780`.
- Default Native product bundle was restored after capture to:
  `eaf1b834841fd25fb135a59895be62f5d406ae867aaaaeedc71175703ca52dcb`.
- Theme/density: dark / comfortable.
- Web and Lynx-for-Web: `1440x900`, DPR 1.
- Native outer window: `1440x900`.
- Native LynxView: `2880x1736`, DPR 2 (`1440x868` logical content).

All clients used the same real state with Claude, OpenCode, and Pi updates.

## Theme and Navigation

- Web used rendered Settings, Appearance, Dark, and Providers controls.
- Lynx-for-Web used its rendered Dark control. Changing theme remounted the
  Lynx renderer and reset the in-memory Settings section; the first attempted
  Providers frame was invalidated.
- The retained Lynx-for-Web frame re-entered Providers through the rendered
  Providers navigation row after the dark remount stabilized.
- Native loaded the formal startup deep link
  `synara://settings/providers` after its owned KV had been set to dark while
  the app was stopped.

No hidden route state or SQLite fixture was written.

## Geometry

| Owner | Web | Lynx-for-Web | Native |
| --- | ---: | ---: | ---: |
| Main content x | `536` | `536` | `536` |
| Updates card | `624x337.5` | `624x338.5` | first row `596x58` |
| Provider tools card | `624x496.5` | `624x496` | first row `596x44` |
| Tool rows | nine | nine at `596x44` | nine, first `596x44` |
| Content frame | `1184x900` browser area | `1184x900` browser area | `1184x868` |

The one-pixel card totals are the same fractional border rounding already
measured in the light / 1280 fast loop.

Native tools-visible state was prepared through the documented command:

`SettingsContent.invoke("scrollTo", { offset: 950, smooth: false })`.

The retained Native frame visibly contains Installed CLIs and all nine provider
rows. Its first tool row is `x=550, y=386, 596x44`.

## Runtime Gates

- Web PNG: exact `1440x900`; page errors empty; console empty.
- Lynx-for-Web PNG: exact `1440x900`; page errors empty; root class
  `SliceRoot--theme-dark`; console contains only the known upstream deprecated
  web-core initialization warning.
- Native closed and tools-visible PNGs: exact `2880x1736`.
- Both Native captures are PID-bound to root `68996`, child `68998`,
  `localhost:8904/session 1`.
- Native session URL is exactly
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Both Native warning/error consoles are empty.
- Existing user clients `localhost:8901` and `localhost:8902` were untouched.

## Cleanup

- Owned Native and server processes exited.
- Native KV was restored byte-exact to
  `f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.
- Native window state was restored byte-exact to
  `2dd961d318ba0c6680929b6f58d30c76e82e6aa6f9e3b719955d1e06d69e571b`.
- Server settings remained
  `d221bb251a46a7341676e93bcb682b6c09c89259429c4d2efff4ab5232ec1269`.
- SQLite remained
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Default Native bundle was rebuilt and contains only
  `ws://127.0.0.1:58090`.

## Artifacts

- `web/`: current Web authority dark / 1440 frame, geometry, and console gates.
- `lynx/`: current Lynx-for-Web dark / 1440 frame, geometry, and console gates.
- `native-closed/`: exact-owned dark closed-state DOM, geometry, styles,
  screenshot, identity, and console.
- `native-tools/`: exact-owned dark tools-visible DOM, geometry, styles,
  screenshot, identity, and console.
