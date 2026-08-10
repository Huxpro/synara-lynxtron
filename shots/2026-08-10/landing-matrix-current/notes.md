# Landing current-state matrix refresh

Status: Browser matrix complete; Native light cells retained; Native dark cells
blocked by the current Desktop DevTool input implementation.

## Identity

- Browser source base: `13561914`
- Native source base: `3b9e343c`
- The only intervening product change is the titlebar
  `[focusable='true'] { -x-app-region: no-drag; }` selector; it does not alter
  Landing pixels.
- Shared isolated server: `ws://127.0.0.1:58710`
- Frozen snapshot SHA-256:
  `253d6ffed93f5ca1cb2f0179bdb0d3cbba9123ddecb74a2f6add5cd84077ad5e`
- Native bundle SHA-256:
  `6715abf461df774dee4a0436193f11dddb2a97497224f53cedebdd2173339474`
- Native state root: `/tmp/synara-landing-native-state`

## Browser matrix

Web and Lynx-for-Web retained all four requested theme and size coordinates
against one snapshot:

| State | Mean absolute RGB diff |
| --- | ---: |
| Light, 1280x820 | 0.9688 |
| Dark, 1280x820 | 1.7066 |
| Light, 1440x900 | 1.0836 |
| Dark, 1440x900 | 2.0652 |

All eight PNGs match the requested logical dimensions at DPR 1, and all error
logs are empty. Heading, Composer, and project-trigger anchors differ by less
than one logical pixel between Web and Lynx-for-Web.

## Native startup and interaction audit

The earlier partial Native frame showed an offline/cooldown state. That state
does not reproduce on current HEAD:

- three independent cold starts rendered `LandingComposer`;
- each exact-owned PID held an established socket to `127.0.0.1:58710`;
- no DOM contained `offline`, `cooling down`, or `TransportStatusRetry`;
- warning/error DevTool consoles were empty;
- a real Project Picker open/close path succeeded before the user restricted
  subsequent automation to `$lynx-devtool`.

No speculative transport change was made.

## Retained Native light cells

| State | Exact PID/client | PNG | Console |
| --- | --- | --- | --- |
| Light, 1280x820 | `39893` / `localhost:8902/session 1` | `2560x1640` | empty |
| Light, 1440x900 | `47584` / `localhost:8901/session 1` | `2880x1800` | empty |

Both processes loaded
`apps/lynx/dist/desktop/main.lynx.bundle`, connected to the isolated server,
reported the expected light/comfortable/wide root classes, and exposed zero
retry nodes. Geometry matches Lynx-for-Web:

- 1280 heading `608,367,321x35`, Composer outer
  `400,421,736x95`, project trigger `408,520,122x28`;
- 1440 heading `688,407,321x35`, Composer outer
  `480,461,736x95`, project trigger `488,560,122x28`.

The retained `ComposerInputSurfaceLynx` box excludes its one-pixel border and
therefore reports `734x93`; its border quad is the canonical `736x95` outer
surface.

Downsampling the Native DevTool frames from DPR 2 to logical size and comparing
them with Lynx-for-Web produces mean absolute RGB differences of `0.9959`
(1280) and `0.8069` (1440). Blank main-canvas regions are pixel-identical
(`0.0`); the remaining difference is concentrated in text/icon
antialiasing.

## Native dark-cell limitation

Only `$lynx-devtool` was used after the user's correction. The exact Desktop
client advertises `Input.emulateTouchFromMouseEvent`, and calls return `{}`,
but the implementation is a no-op:

- Settings remained on Landing after a press/release sequence at its exact
  `DOM.getBoxModel` center;
- Project Picker remained `aria-expanded=false` after independent
  `touchstart/touchend`, `mouseMoved/mouseReleased`, `tap`,
  `mousedown/mouseup`, and `mouseDown/mouseUp` probes.

`Lynx.getRectToWindow` also terminated the diagnostic Desktop client with
`SIGTRAP`; that process and its output were discarded. The dark Native cells
are therefore not retained. Theme state was not edited directly, and no
Runtime/DOM mutation was used to manufacture evidence.

## Remaining scope

- Native dark Landing at 1280x820 and 1440x900 still needs a DevTool build
  whose Input domain dispatches real events, or another user-approved real
  product interaction path.
- Native arbitrary text-range selection and in-app PDF rendering remain the
  explicit host/engine gaps already recorded in the P10 audit.

## Cleanup

- Exact-owned Native, server, and Web processes were stopped.
- Owned ports `58710`, `9843`, `8901`, and `8902` were released.
- `/tmp/synara-landing-native-state` and
  `/tmp/synara-landing-rpc-repro` were removed.
- Historical `.p10-view*`, older screenshots, and unrelated processes were not
  modified.
