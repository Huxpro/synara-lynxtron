# Settings General current-head matrix refresh

Status: complete current-head Web, Lynx-for-Web, and Native route matrix

## Identity

- Source base: `25a85f29`
- Shared server: `ws://127.0.0.1:58500`
- Web host: `http://localhost:9301`
- Isolated state: `.synara-settings-general-matrix-current` (removed)
- Frozen SQLite backup SHA-256:
  `36daed2170b1294ee3efd8e9379aec3e5b0290fcb13e2099f8016ae0f44fefe4`
- Lynx-for-Web bundle SHA-256:
  `7e0d17545f2d22bbaf53116e2984ce86a888cfe7c03fee4e8dc5d82f6d6a113d`
- Native bundle SHA-256:
  `7fccad8f72c8115c83e84aec0731cfac5b9130c7c3d0b7a39ea6f35e6a0450f7`
- Output and staged bundle copies matched before launch.

## Retained Browser matrix

One named browser session captured Web and Lynx-for-Web from the same server,
snapshot, route, theme, density, viewport, and DPR:

| State | Web | Lynx-for-Web | Mean absolute RGB diff |
| --- | --- | --- | ---: |
| Light, 1280x820 | retained | retained | 0.5922 |
| Dark, 1280x820 | retained | retained | 5.3949 |
| Light, 1440x900 | retained | retained | 0.5095 |
| Dark, 1440x900 | retained | retained | 4.7432 |

All eight retained PNGs match their requested viewport dimensions at DPR 1.
All eight error logs are empty. Lynx reports the expected theme, comfortable
density, wide viewport classes, and zero `TransportStatusRetry` nodes.
The General heading geometry is exact across both clients:

- 1280: `456,32,363.890625x28`
- 1440: `536,32,363.890625x28`

Theme changes and navigation used rendered Appearance and Settings controls.
Both clients were restored to System and the named browser sessions were
closed.

## Residual disposition

The light pairs are nearly pixel-identical. The remaining dark difference is
not a new local Settings geometry, type, content, or control-state defect:

- main blank canvas samples match at RGB 17;
- shared heading, row-label, font, and line geometry match exactly;
- values and visible copy match;
- the difference is concentrated in elevated/inset control materials.

This is the already registered host material boundary in
`shots/2026-08-07/dark-shell-material-boundary/`: Web resolves translucent
Electron/macOS material recipes, while Lynx-for-Web and Native use the
canonical opaque dark projection. Hardcoding one captured backdrop color
would fork shared theme semantics, so no product CSS change was made.

## Invalid Browser diagnostics

Two first-pass Web dark captures remained light because a DOM-scripted radio
click did not activate the control. They were overwritten only after a fresh
accessibility snapshot showed `Dark [checked=true]` through the real control.

The first 1440 light Web capture also contained the provider-update toast even
though page errors were empty. It was replaced after dismissing the rendered
toast and recording `toastCount: 0`.

No invalid frame is retained as a passing matrix cell.

## Native matrix

The paired `0.0.9-dev` diagnostic host was restored from the published npm
package into `/tmp` without changing workspace dependencies. It registered a
separate exact-owned `@synara/lynx` client on `8902`; unrelated
`@t3tools/lynxtron` remained on `8901`.

The first diagnostic-host launch exposed a real current-head startup
regression: the document remained an empty `PAGE` and the console reported
`QuickContext::Execute() TypeError: not a function` followed by missing
snapshot errors. A clean rebuild was byte-identical and reproduced it.

An automated exact-host bisect used `fb6cdcb3` as known good and found
`7165953d` (`Render Explorer image previews safely`) as the first bad commit;
`99e2b46c` was confirmed good. The newly reachable
`packages/shared/src/localPreviewFiles.ts` module constructed its exported
regex at module evaluation time with `Array.map` and `String.replaceAll`.
ReactLynx's main-thread runtime does not support that operation. Replacing the
initializer with the equivalent static regex preserves the allowlist and
restores startup. A focused test locks every canonical image extension against
the regex.

Two exact-owned Native launches then retained the four required cells:

| State | Root PID | Client | PNG | Console |
| --- | ---: | --- | --- | --- |
| Light, 1280x820 | `72290` | `localhost:8902/session 1` | `2560x1640` | empty |
| Dark, 1280x820 | `72290` | `localhost:8902/session 1` | `2560x1640` | empty |
| Dark, 1440x900 | `78385` | `localhost:8902/session 1` | `2880x1800` | empty |
| Light, 1440x900 | `78385` | `localhost:8902/session 1` | `2880x1800` | empty |

Every capture points to the staged
`apps/lynx/dist/desktop/main.lynx.bundle`, contains the expected theme,
comfortable density, viewport dimensions, General header/content/first-row/
first-control roles, and zero warning/error console messages. Theme and route
changes used rendered controls. Native was restored to System before shutdown.

## Cleanup

- Both retained Native launches and all diagnostic/bisect launches were
  stopped.
- Owned server/Web ports `58500` and `9301` were released.
- Isolated Web and Native runtime state was removed after the frozen SQLite
  backup was written.
- The temporary diagnostic runtime and bisect worktree were removed after
  verification.
- The unrelated `@t3tools/lynxtron` client on `8901` remained running and was
  not touched.
- Historical `.p10-view*` and older evidence directories were not modified.
