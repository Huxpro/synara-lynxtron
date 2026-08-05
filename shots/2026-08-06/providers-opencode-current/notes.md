# Current-head OpenCode provider-tools disclosure

## Scope

This evidence closes the provider-specific branch that Codex cannot cover:

- OpenCode binary path;
- OpenCode server URL;
- OpenCode server password;
- OpenAI response WebSockets.

No field or switch value was changed.

Both clients consume this configuration from the same
`@synara/shared/providerTools` entry.

## Identity

- Source commit: `06485112`.
- Shared snapshot:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Lynx-for-Web bundle:
  `4efc66686ddec6ee4267a265e50ff81dfa1cfc5309ab01b58a5b9f4ea2675183`.
- Native online bundle:
  `9184c73835963c442b533be89745b2cd808b60a7dd020289ba79c210e370cc77`.
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
  `af1289524bb0880088166b0d55d74cf44ec53e067507607490e8b36589671e2d`
  and contains only `ws://127.0.0.1:58090`.
- KV/window/settings/SQLite remained byte-exact.
