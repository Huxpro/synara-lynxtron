# Current-head OpenCode provider-tools disclosure

## Scope

This evidence closes the provider-specific branch that Codex cannot cover:

- OpenCode binary path;
- OpenCode server URL;
- OpenCode server password;
- OpenAI response WebSockets.

No field or switch value was changed.

## Identity

- Source commit: `06485112`.
- Shared snapshot:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Lynx-for-Web bundle:
  `52b92766573497209b59db06104c536f23ceb8a177bf09a6bcaca942094a7c5b`.
- Native online bundle:
  `98083afbc10c3f6891fabcfa9b59db9d2274619a9d1b8046ea39be42a22bd780`.
- Viewport: Web/Lynx-for-Web `1280x820`, Native `2560x1576`.

## Web Authority

The first direct `/settings?section=providers` request hit the static server's
404 and was rejected. Retained evidence entered through rendered Settings and
Providers controls, scrolled the real Installed CLIs card, and opened the
rendered OpenCode row.

The retained page exposes all four authoritative labels. Its three inputs are
text, text, and password in the expected order. Page errors are empty.

## Lynx-for-Web

- OpenCode row: `596x429`.
- Disclosure content: `596x385`.
- Three input wrappers: `572x28`.
- WebSocket switch: `32x20`, off.
- Label order exactly matches Web.
- Page errors are empty; console contains only the known upstream web-core
  initialization warning.

## Native

The startup deep link was superseded by renderer route restore on this launch,
so that attempted state was rejected. Retained evidence navigated through the
rendered Settings and Providers rows, used the documented SettingsContent
`scrollTo` command, and activated the rendered OpenCode trigger through
exact-client press/release events.

- Exact-owned root PID `51532`, child `51534`,
  `localhost:8904/session 1`.
- Session URL points exactly to this repository's staged Native bundle.
- Disclosure content: `596x385`.
- First input wrapper: `572x28`.
- Boolean field shell: `572x76`.
- Exact OpenCode switch node: `32x20`, `aria-checked=false`,
  accessibility value `Off`.
- Native INPUT nodes:
  - OpenCode binary path: text, `readonly=false`;
  - OpenCode server URL: text, `readonly=false`;
  - OpenCode server password: password, `readonly=false`.
- Every input publishes focus, selection, and blur handlers.
- Warning/error console: empty.

## Cleanup

- Owned app and server processes exited.
- Default Native bundle was restored to
  `eaf1b834841fd25fb135a59895be62f5d406ae867aaaaeedc71175703ca52dcb`
  and contains only `ws://127.0.0.1:58090`.
- KV/window/settings/SQLite remained byte-exact.
