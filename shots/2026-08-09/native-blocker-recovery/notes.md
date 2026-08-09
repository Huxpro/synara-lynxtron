# Native blocker recovery

Status: Runtime recovery pass; not a complete fidelity recertification

Commit: `b7b06ac7`

Bundle:

- path: `apps/lynx/dist/desktop/main.lynx.bundle`
- SHA-256: `724cfa5e52b14ec945ec96cb9fec349e94703207a50d0878b7bcc384abd99b50`

Runtime:

- production dependency: Lynxtron `0.0.9`
- diagnostic runtime: paired `0.0.9-dev`, used only to expose the local
  PID-derived DevTool connector
- isolated server: `127.0.0.1:58800`
- isolated state: `.synara-native-matrix`
- isolated renderer state: `/tmp/synara-native-matrix-user`
- route: `/settings/general`

## Cells

| Cell | Outer window | Root class | Route | Console | Screenshot |
| --- | --- | --- | --- | --- | --- |
| Settings light | `1280x820` | `SliceRoot--theme-light` | Settings found in the exact-client DOM | no error/warning entries | `settings-light-1280.png`, `2560x1640` |
| Settings dark | `1440x900` | `SliceRoot--theme-dark` | Settings found in the exact-client DOM | no error/warning entries | `settings-dark-1440.png`, `2880x1800` |

The theme was supplied through the product's persisted `synara:theme` format in
the isolated KV file. Window dimensions were supplied through the isolated
native `window-state.json`; CoreGraphics confirmed the requested outer bounds.

## Result

Both cells initialized the current production bundle, rendered a populated
document tree, reached `shellRendererReady`, and retained clean exact-client
error/warning consoles. This closes the former template-context startup
blocker for both themes and both certification sizes.

Lynxtron `0.0.9` DevTool screenshots cover the full outer window dimensions,
whereas the previous `0.0.7` harness documented titlebar-subtracted LynxView
dimensions. These frames are therefore retained as runtime-recovery diagnostics
and are not presented as a replacement for the complete route-by-route Native
fidelity matrix. Environment loaded-data certification still requires a
canonical thread snapshot on the isolated server.
