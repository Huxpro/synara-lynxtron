# Provider update labels in compact dark mode

## Newly discovered scope

This loop actively added a state not covered by the existing Providers matrix:

- Web authority and Lynx-for-Web at `390x844`, DPR `1`, dark;
- Providers with real behind-latest Claude, OpenCode, and Pi rows;
- compact Update summary actions;
- OpenCode provider tools expanded;
- OpenAI response WebSockets changed `Off -> On -> Off`;
- disclosure collapse and reopen after the canonical setting roundtrip;
- minimum supported Native `900x650`, dark, for the repaired action label.

The older matrix already covered wide light, wide dark, and OpenCode disclosure
anatomy. Those cells were not counted as new scope.

## Harness identity

Both browser renderers used the same owned server at
`ws://127.0.0.1:58090`, the same isolated state directory, the same Providers
route, dark media, and the same `localhost:8891` trusted origin.

Lynx-for-Web was rebuilt with the explicit `58090` relay and staged under:

`/lynx-provider-compact-current/index.html`

The served and local `web-host.js` hashes were byte-identical. Relay
diagnostics reported:

- configured/active endpoint `ws://127.0.0.1:58090`;
- socket state `1`;
- renderer-ready route `/settings/providers`;
- zero pending requests;
- no transport or RPC error.

An initial `/lynx-provider-compact-current/` request hit the Vite SPA fallback
and rendered the Web shell instead of Lynx-for-Web. That frame was rejected as
a capture-identity harness loss. Several later pointer scripts also failed
before interaction because this `agent-browser` version rejects fractional
mouse coordinates with a misleading missing-arguments error. Each failed
attempt exited through `browser:run`, returned to zero sessions/processes, and
did not mutate product state.

## P1 product loss

Web authority rendered each provider Update action as a visible icon-and-label
button:

- `73.05x28`;
- text `Update`;
- `11px` text and `4px` gap.

Before the fix, Lynx rendered:

- `28x24`;
- only the `12x12` download icon;
- `Update` as a `RAW-TEXT` node with a `0x0` box.

The accessible label remained present, but sighted Native/Lynx users saw an
unexplained icon instead of the authoritative action. The same mixed-children
failure affected both the Provider updates inset and Provider tools rows.

`lynx-provider-update-visible-label`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

`SettingsProviderToolsPanel.lynx.tsx` now explicitly owns the action label as:

`<text className="LxButton__text">...</text>`

for both Update action implementations. This follows the established Lynx
Button contract for mixed icon/text children rather than changing global
Button behavior.

After the fix, compact Lynx-for-Web rendered all three visible Update actions
as:

- `69.84x24`;
- `12x12` icon;
- real `X-TEXT.LxButton__text` at `35.84x15`;
- visible `Update`.

## Interaction evidence

Using integer pointer coordinates through the rendered product path:

1. OpenCode changed `Collapsed -> Expanded`.
2. The disclosure measured `314x483`; content measured `314x439`.
3. The WebSocket switch remained reachable at `32x20`.
4. A real switch touch persisted `experimentalWebSockets: true`,
   settings revision `1`.
5. A second touch restored `experimentalWebSockets: false`,
   settings revision `2`.
6. Collapse and reopen restored `Expanded` with the switch still Off.
7. SQLite remained byte-identical at
   `a209ba85773882b79b8147779c406fbb67a12dcb723ba7c4ea7ca3168e651cc8`.

The compact Lynx root correctly resolved dark. Its page-local Settings class
temporarily remained light under system-dark media, unlike explicit-dark
Native. This is recorded as a separate theme-owner residual and is not used to
inflate or close the Update-label loss.

## Native certification

The published `0.0.9` host rendered but did not register an owned DevTool
listener, so that attempt was rejected as a harness capability failure.
The temporary published `0.0.9-dev` diagnostic host then registered exact-owned
PID `48616` at PID-derived `localhost:8902`; unrelated another-project PID `18721`
remained on `8901` and was not touched.

Native identity:

- session `1`;
- exact URL
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- root `900x650`, dark, medium viewport;
- Settings page dark;
- bundle SHA-256
  `8b7a3c52b5775b4f11e9a460a99f078d6bc3f1d4dd8f6252d8e4fbec5bb95662`.

Each visible Native Update action measured `70x24` and contained:

- a real `SVG` icon;
- a real `TEXT.LxButton__text`;
- `RAW-TEXT "Update"`;
- text box `36x15`;
- `10px/15px`, dark foreground `rgb(252,252,252)`.

The exact-client warning/error console was empty.

Native minimum-window label rendering is certified here. The compact
OpenCode toggle interaction is Lynx-for-Web evidence; it is not mislabeled as
Native input certification. Earlier exact-owned Native evidence already covers
the OpenCode disclosure and switch anatomy.

## Verification and cleanup

- Focused Provider + Settings navigation suites: `2` files / `15` tests.
- Native/Desktop production build: passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Output/staged Native bundles were byte-identical.
- Browser entry cleanup passed.
- Browser exit query returned `sessions: []`.
- Exit cleanup reported zero agent-browser-owned processes.
- No browser screenshot was retained; local count remained `100`.
- Owned ports `58090`, `8891`, and `8902` were free.
- Temporary browser stage, server state, Native user/runtime state, and
  diagnostic package were removed.
- Unrelated another-project `8901` remained running and untouched.
