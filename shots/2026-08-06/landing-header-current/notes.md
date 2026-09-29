# Current-head Landing header fidelity

## Scope

- Date: 2026-08-06.
- Slice: shared chat-surface header identity used by Landing and Thread.
- Browser cell: light / comfortable / `1280×820`, DPR 1.
- Owned server: `127.0.0.1:60480`.
- Owned static origin: `http://localhost:8925`.
- SQLite snapshot:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Lynx-for-Web bundle:
  `eb3ed31aa13e8eefaabd842c1ccf79af4b91c4821904b4bbce4affdcf0f8dafc`.
- Native bundle:
  `0738aa524f6296158166e95b41091380e458adcf0c0fd5df6f2c9251ae5023a3`.

Web and Lynx-for-Web were served from the same trusted origin and connected to
the same isolated server. Both Browser PNGs are exactly `1280×820`.

## Residual and owner

The current-head pair exposed a typography residual that the 2026-08-04 atlas
had recorded but not blocked:

- Web `New Chat`: `12px / 18px / 400`, box
  `298 / 14 / 55.0625 / 18`.
- Lynx before repair: `12px / normal / 400`, box
  `298 / 15.5 / 55.0625 / 15`.

The owner was not a route margin. Landing and Thread both consume
`SharedChatHeaderIdentityTitle`, whose Lynx CSS omitted the explicit Web
line-height. The shared owner now defines `line-height: 18px`.

After repair, Web and Lynx-for-Web are exact for the title:

| Client       |   x |   y |   width | height | Typography    |
| ------------ | --: | --: | ------: | -----: | ------------- |
| Web          | 298 |  14 | 55.0625 |     18 | 12 / 18 / 400 |
| Lynx-for-Web | 298 |  14 | 55.0625 |     18 | 12 / 18 / 400 |

The rest of the Landing anchors did not move:

- sidebar: `0 / 0 / 256 / 820` in both Browser clients;
- composer: Web `400 / 461.75 / 736 / 95`, Lynx
  `400 / 461 / 736 / 95`;
- project trigger: Web `408 / 560.75 / 122.859375 / 28`, Lynx
  `408 / 560 / 122.859375 / 28`;
- heading retains the known browser-engine fractional rasterization only.

No anonymous offset was added.

## Product route integrity

The Web app restored a previously selected thread when first opened. The
retained Web state was reached through the rendered `Open new chat home`
control using keyboard focus and Enter. Current Web product behavior represents
that fresh home state with a client-only draft UUID route while rendering
`New Chat`; SQLite and settings hashes remained unchanged. The evidence records
this as semantic `new-chat-draft`, not as a literal `/` route.

Lynx retained its native `new-chat` memory-history state. No hidden route state
or SQLite fixture was injected.

## Native

- Launch root PID: `28092`.
- Owned renderer PID: `28096`.
- PID-derived DevTool client: `localhost:8903`.
- Session: 1.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Raw screenshot: `2560×1576`, corresponding to the `1280×788` Lynx content
  frame below the macOS title bar.
- Native title: `296 / 14 / 56 / 18`.
- Native computed typography: `12px / 18px / 400`.
- Native warning/error console: empty.

The Native 2px x difference is inherited from its 255px sidebar/content
boundary and integer text measurement; the line box and vertical anchor are
the repaired contract.

## Harness and cleanup

- The first screenshot-helper call used a relative output path. The helper
  changes into `apps/lynx`, so that diagnostic call failed with `ENOENT`.
  Re-running with an absolute output path succeeded; no product state changed.
- Lynx-for-Web logged only the known upstream initialization deprecation
  warning. Browser page-error files and Native warning/error console are empty.
- Owned server/static/Native processes and named Browser sessions exited.
- The `8903` port was later reused by a separately owned `t3code` Lynxtron
  process after PIDs `28092/28096` had exited; it was not touched.
- Normal SQLite, settings, Native KV, and window-state hashes remained
  byte-exact.

## Gates

- Focused shared-header contract: 1 file, 1/1.
- Web production build: pass, 8,943 modules.
- Lynx-for-Web production build: pass.
- Native/Desktop production build: pass with only the existing unsupported CSS
  and optional `ws` native-module warnings.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
