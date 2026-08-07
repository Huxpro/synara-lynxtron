# Current-head landing and Chats hitbox fidelity

Status: retained same-origin Web/Lynx-for-Web paired evidence and exact-owned
Native closure for the Chats disclosure hitbox.

## Harness

- Source base: `5d296ee8`.
- Shared isolated server: `ws://127.0.0.1:58155`.
- Shared trusted Web origin:
  - Web: `http://localhost:8998/8e5802a8-2da5-45aa-8d52-69f9c8034ac6`;
  - Lynx-for-Web: `http://localhost:8998/lynx/index.html`.
- Both Browser cells use `1280x820`, DPR 1, light theme, comfortable density,
  New Chat, no provider banner, and no Environment overlay.
- Three-client preflight resolved one server instance
  `66b6c98d-96e2-4da9-9de0-b72daf3df3bd`, snapshot sequence 0.
- The read-only SQLite online-backup used for Native identity hashes to
  `6429e8ba8289408489b94ca43a418f8c879b942bbc5353186eb8c362bdf38fde`.

## Landing baseline

The clean Browser pair confirms the current landing focal composition is
already converged and should not receive another offset:

- Sidebar and main: exact `256x820` / `1024x820`.
- Header title: exact `x=298, y=14, 55.0625x18`.
- Heading: Web `607.8125,367.25,320.359375x34.5`; Lynx
  `607.5,367,321x35`.
- Composer surface: Web `400,421.75,736x95`; Lynx `400,421,736x95`.

The largest common-anchor difference is 0.75px. The Browser screenshots that
still showed the Environment dock or a provider banner were harness diagnostics
and were overwritten before the clean Web frame was retained.

## Residual

Web gives the Chats disclosure the same Sidebar rail as other primary rows:

- root horizontal inset: 6px;
- hitbox: `x=6, width=244, height=28`;
- internal horizontal padding: 8px;
- label x: 14px.

Lynx previously used a 10px root inset plus 4px left-only button padding. The
two mistakes happened to keep the label at x=14, but reduced the interactive
hover/focus surface to `x=10, width=236`.

The fix maps the actual shared anatomy instead of preserving accidental text
alignment:

- `.SharedSidebarChatsRoot`: 6px left/right;
- `.SharedSidebarChatsHeaderButton`: 8px left/right.

Final Lynx-for-Web geometry is `x=6, width=244, height=28`, with the label still
at x=14. Main, heading, and Composer widths are unchanged.

## Native

- Production bundle:
  `01e8acb6cab12c00df16674969aaf45bbe5546ce28bd8b33a11517b970361dee`.
- Owned launch root/child: `48844 -> 48952`.
- PID-derived DevTool target: `localhost:8901/session 1`.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Native root/sidebar/main: `1280x820`, `256x820`, `1024x820`.
- Native Chats root/button/label:
  - root `0,325,256x28`;
  - button `6,325,244x28`;
  - label `14,332,34x15`.
- Warning/error console: empty.

The first Native attempt used a bundle built for the default service endpoint,
rendered `Server unavailable`, and correctly failed closed because the required
Chats role did not exist. No retained metadata from that attempt remains.

## Host boundary

The current Web browser fallback header is 48px while exact Native/Electron
hidden-titlebar chrome is already certified at 46px. That produces a 2px
vertical offset in Browser-vs-Native sidebar rows. It is a host-presentation
boundary, not justification to regress the certified Native titlebar or add
local row offsets. This slice changes only the cross-host Chats horizontal
hitbox contract.

Focused Sidebar tests pass 3/3. Lynx-for-Web and Native/Desktop production
builds pass with only the existing encoder and optional `ws` warnings.
