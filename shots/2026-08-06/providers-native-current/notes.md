# Current-head Providers Native certification

## Identity

- Source commit: `3cd4c79ea7114742522c9305128dadb93e5d74fe`.
- Certification bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`.
- Certification bundle SHA-256:
  `9184c73835963c442b533be89745b2cd808b60a7dd020289ba79c210e370cc77`.
- The certification bundle was built with
  `SYNARA_WS_URL=ws://127.0.0.1:60462`; strings contain the explicit endpoint
  plus the normal `58090` fallback.
- Shared SQLite snapshot SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Route: startup deep link `synara://settings/providers`.
- Theme/density: light / comfortable.
- Native outer window: `1280x820`.
- Native LynxView: `2560x1576`, DPR 2 (`1280x788` logical content).

## Exact Ownership

Two background launches were used because a diagnostic `Page.reload` reset the
first renderer route and invalidated its later interaction state.

- Initial closed capture: root PID `95383`, PID-owned
  `localhost:8904/session 1`.
- Retained tools/open/focus batch: root PID `28908`, PID-owned
  `localhost:8903/session 1`.
- Both session URLs were exactly
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Existing user clients `localhost:8901` (Lynxtron Fiddle) and
  `localhost:8902` (Lynx Go S) were never selected or controlled.

The second launch intentionally reused no remembered port. PID `28917` owned
the `8903` listener, and the capture helper resolved that listener from root
PID `28908`.

## Certified States

### Closed

- Providers root: `624x1601`.
- First real update row: `596x58`.
- First provider-tool row: `596x44`.
- Settings content frame: `1024x788`.
- Warning/error console: empty.

### Tools Visible

The state was prepared through the documented native `<scroll-view>` command:

`SettingsContent.invoke("scrollTo", { offset: 950, smooth: false })`.

The independently captured frame visibly contains `Installed CLIs`, all nine
provider rows, current versions, and update actions. Warning/error console:
empty.

### Codex Open

The rendered Codex trigger was activated through
`Input.emulateTouchFromMouseEvent` press/release events.

- Trigger accessibility: `Codex provider tools`, `Expanded`, focusable button.
- Open Codex row: `596x257`.
- Disclosure content: `596x213`.
- Motion class: `LynxDisclosureMotion--open`.
- Visible docs: Install, Update, Config.
- Visible fields: Codex binary path and `CODEX_HOME`.
- Field wrapper: `572x28`.
- Both native INPUT nodes have `readonly=false` plus focus, blur, selection,
  and confirm handlers.
- Warning/error console: empty.

### Focus Tap

The rendered `CODEX_HOME` field was tapped through exact-client press/release
events. No keyboard input was sent and no value was committed.

- Server `settings.json` SHA-256 stayed
  `d221bb251a46a7341676e93bcb682b6c09c89259429c4d2efff4ab5232ec1269`.
- SQLite SHA-256 stayed
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Warning/error console: empty.

This certifies the Native rendered input surface and focusable command
contract. It does **not** claim Native text entry, IME composition, selection,
paste, or undo/redo; those remain separate platform-input boundaries.

## Harness Corrections

- The first generic Native production build contained only the default
  `58090` endpoint and was rejected for online certification.
- A `mouseWheel` attempt and a drag attempt did not move the Native
  `<scroll-view>` and were not treated as evidence.
- `DOM.scrollIntoViewIfNeeded` and a child-element `scrollIntoView` probe
  changed/invalidated diagnostic frames without proving the intended scroll
  state. The app was restarted before retained interaction evidence.
- One diagnostic command tried remembered port `8904` after restart and was
  rejected with `ECONNREFUSED`; the retained second batch re-resolved
  `localhost:8903` from the new PID tree.

## Cleanup

- Owned Native and server processes exited.
- Owned server and Synara DevTool listeners exited. Port `8903` was later
  reclaimed by an unrelated T3 Code Lynxtron process whose session URL is
  `/Users/bytedance/github/t3code/apps/lynxtron/dist/desktop/main.lynx.bundle`;
  it was not touched.
- Owned KV remained byte-exact at
  `f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.
- Owned window state remained byte-exact at
  `2dd961d318ba0c6680929b6f58d30c76e82e6aa6f9e3b719955d1e06d69e571b`.
- Server settings and SQLite remained byte-exact.

## Artifacts

- `closed/`: initial current-head route and geometry.
- `tools/`: all provider-tool rows after documented native scroll.
- `open/`: rendered Codex disclosure after real touch activation.
- `focused/`: rendered input state after tapping `CODEX_HOME`.
- Every directory contains PID-bound `capture.json`, `dom.json`,
  `geometry.json`, `styles.json`, `raw.png`, and empty `console.txt`.
