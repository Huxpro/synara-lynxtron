# P4-X1 — Lynxtron shell capability mapping

Source audit: `synara/apps/desktop/src/main.ts` and its focused helpers. This is a
shell capability translation, not a line-by-line Electron port.

| Electron shell capability           | Lynxtron translation                                                                                          | Status / boundary                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| BrowserWindow bounds/max/fullscreen | `LynxWindow` + atomic `window-state.json`; off-screen bounds recentered against `screen.workArea`             | Implemented                                                                                          |
| Native app menu + accelerators      | `Menu.buildFromTemplate`; Threads/Projects/PR/Settings dispatch `GlobalEventEmitter` routes                   | Implemented                                                                                          |
| `globalShortcut`                    | Application-menu accelerators (`CmdOrCtrl+1/2/3/,`) while app menu is active                                  | Deliberate degradation; no background/global capture                                                 |
| custom `synara://` URLs             | single-instance lock + `open-url`/`second-instance`; settings/thread URLs map into memory history             | Implemented; packaged app registers handler                                                          |
| renderer IPC                        | existing `-lynx-invoke` bridge + `sendGlobalEvent`; new window/shell calls align with Web `WindowPort`        | Implemented                                                                                          |
| desktop/main logging                | bounded Node file log (`desktop-main.log`, one 1 MiB rotation); failures never block startup                  | Implemented                                                                                          |
| state migration                     | move legacy root `kv.json` and `desktop-window-state.json` only when destination is absent                    | Implemented, idempotent                                                                              |
| clipboard/dialog                    | Lynxtron `clipboard/nativeImage/dialog` through P2-V2 host services                                           | Implemented                                                                                          |
| backend process                     | P0-S1 proved `utilityProcess.fork`; current vertical slice deliberately connects to an existing Synara server | Proven, integration deferred until packaged sidecar input exists                                     |
| static protocol                     | production `loadFile(main.lynx.bundle)`; custom resource protocol unnecessary for the single bundle           | Native file path                                                                                     |
| `session` / permission handlers     | no Lynxtron equivalent                                                                                        | Not available; do not auto-grant OS permissions                                                      |
| `autoUpdater` / electron-updater    | unavailable                                                                                                   | P4-X2 implemented: GitHub release metadata check + fixed external download page; no download/install |
| embedded browser manager/AppSnap    | relies on Electron WebContents/session/native helper                                                          | Out of P4-X1; explicit desktop-exclusive gap                                                         |

Runtime capability discovery is available through bridge method
`shellCapabilities`; it returns `native`, `menu-accelerator`,
`external-download`, or `not-available` rather than pretending missing APIs
exist.
