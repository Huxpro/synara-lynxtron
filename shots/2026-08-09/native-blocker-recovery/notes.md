# Native blocker recovery

Status: Runtime recovery pass; not a complete fidelity recertification

Commit: `b7b06ac7`

Bundle:

- path: `apps/lynx/dist/desktop/main.lynx.bundle`
- SHA-256: `cf453720348ffd0fc018673a79991e96ee4c26cd16bcc84bea32e506224385ca`

Runtime:

- production dependency: Lynxtron `0.0.9`
- diagnostic runtime: paired `0.0.9-dev`, used only to expose the local
  PID-derived DevTool connector
- isolated server: `127.0.0.1:58800`
- isolated state: `.synara-native-matrix`
- isolated renderer state: `/tmp/synara-native-matrix-user`
- startup route: `synara://settings/general`

## Cells

| Cell | Outer window | Root class | Route | Console | Screenshot |
| --- | --- | --- | --- | --- | --- |
| Settings light | `1280x820` | `SliceRoot--theme-light` / `SettingsPage--theme-light` | `SharedSettingsGeneralRoot` plus active General navigation row | no error/warning entries | `settings-light-1280.png`, `2560x1640` |
| Settings dark | `1440x900` | `SliceRoot--theme-dark` / `SettingsPage--theme-dark` | `SharedSettingsGeneralRoot` plus active General navigation row | no error/warning entries | `settings-dark-1440.png`, `2880x1800` |

The theme was supplied through the product's persisted `synara:theme` format in
the isolated KV file. Window dimensions were supplied through the isolated
native `window-state.json`; CoreGraphics confirmed the requested outer bounds.

## Result

Both cells initialized the current production bundle, rendered a populated
document tree, reached `shellRendererReady`, and retained clean exact-client
error/warning consoles. The original diagnostic used a bare route argument,
which `routeFromArguments` does not accept. These retained files replace that
invalid diagnostic and use the real `synara://settings/general` deep link with
strict `SettingsPage` and `SharedSettingsGeneralRoot` assertions.

Lynxtron `0.0.9` DevTool screenshots cover the full outer window dimensions,
whereas the previous `0.0.7` harness documented titlebar-subtracted LynxView
dimensions. These frames are therefore retained as runtime-recovery diagnostics
and are not presented as a replacement for the complete route-by-route Native
fidelity matrix. Environment loaded-data certification still requires a
canonical thread snapshot on the isolated server.
