# Settings General current-head matrix refresh

Status: Browser tier retained; Native tier blocked by a repeatable Lynxtron
DevTool registration failure.

## Identity

- Source head: `1ffecbdf`
- Shared server: `ws://127.0.0.1:58500`
- Web host: `http://localhost:9301`
- Isolated state: `.synara-settings-general-matrix-current` (removed)
- Frozen SQLite backup SHA-256:
  `36daed2170b1294ee3efd8e9379aec3e5b0290fcb13e2099f8016ae0f44fefe4`
- Lynx-for-Web bundle SHA-256:
  `7e0d17545f2d22bbaf53116e2984ce86a888cfe7c03fee4e8dc5d82f6d6a113d`
- Native bundle SHA-256:
  `5a34e39eaf63263ce4ea521e1858df6ae6c7e6230431ea0d8d80c1375d24df0f`
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

## Native harness blocker

Two exact-owned production launches rendered Settings and connected to the
correct `58500` server, but `@lynx-js/lynxtron 0.0.9` did not register a
PID-owned DevTool listener:

- first launch: CLI PID `83500`, app PID `83507`;
- second clean launch: app PID `85618`;
- both used the staged file bundle and explicit
  `SYNARA_ENABLE_DEVTOOL=1`;
- the built bundle retains the runtime
  `process.env.SYNARA_ENABLE_DEVTOOL === "1"` gate and
  `devtool.setDevToolEnabled(...)` call;
- the child process environment contained all requested flags;
- the only client before and after was unrelated
  `localhost:8901` / `@t3tools/lynxtron`.

After the second identical failure, the restart loop stopped. No unrelated,
remembered, or stale client was used and no Native screenshot was retained.
The structured failure record is
`native/devtool-registration-failure.json`.

This is a harness failure, not a passing Native cell and not a product
regression. The current-head three-client matrix remains incomplete.

## Cleanup

- Both owned Native launches were stopped.
- Owned server/Web ports `58500` and `9301` were released.
- Isolated Web and Native runtime state was removed after the frozen SQLite
  backup was written.
- The unrelated `@t3tools/lynxtron` client on `8901` remained running and was
  not touched.
- Historical `.p10-view*` and older evidence directories were not modified.
