# Settings Shortcut Reload Discoverability

## Classification

- New scope: Keyboard Shortcuts Settings at `1280x820`, dark, with
  Lynxtron-owned Reload and Force Reload commands.
- P1 product loss: `lynx-reload-shortcut-undiscoverable`, `1.00 -> 0.00`.
- Intentional platform delta: Web authority has no application-menu
  `Cmd/Ctrl+R` owner and therefore does not display the supplemental rows.
- Harness loss: the first discovery loop found the isolated Vite authority on
  `8891` had exited while the server remained healthy. The loop stopped,
  `browser:gate` passed, only the Web host was restarted, and a three-client
  connection preflight passed before retry.

## Product Loss

Lynxtron already registered:

- Reload: `CmdOrCtrl+R`;
- Force Reload: `CmdOrCtrl+Shift+R`.

Application-menu tests and earlier exact Native evidence covered the behavior,
but the shared Keyboard Shortcuts settings page was built only from server
keybindings. Host-owned application-menu shortcuts were therefore invisible
to users in the place explicitly described as listing every shortcut.

## Product Fix

- Extend the shared `KeyboardShortcutsSettingsComposition` with an explicit
  `includeDesktopShellShortcuts` capability.
- Keep supplemental rows inside the same searchable section/filter/table/Kbd
  pipeline instead of adding renderer-specific markup.
- Show Reload and Force Reload only in the Lynx/Lynxtron settings consumer.
- Resolve labels by platform:
  - macOS: `⌘R`, `⌘⇧R`;
  - Windows/Linux: `Ctrl+R`, `Ctrl+Shift+R`.
- Web authority keeps its existing server-keybinding-only table because it does
  not own the Lynxtron application menu.

## Harness Identity

After restoring the Web host, connection preflight returned the same:

- server instance:
  `cbfdb4e0-74c1-4df4-9d6c-7d6f358c6de1`;
- snapshot sequence: `188`;
- endpoint: `ws://127.0.0.1:58090`;

for Web, Lynx-for-Web, and Native.

Both browser clients used dark theme, `1280x820`, DPR `1`, and the Keyboard
Shortcuts settings state.

## Web And Lynx-for-Web

Web authority correctly omitted both host-owned rows.

Lynx-for-Web rendered 53 shortcut rows, including:

- Reload app:
  `622x59 @ (457,3205.5)`;
- Force reload app:
  `622x59 @ (457,3264.5)`;
- Search shortcuts:
  `624x28 @ (456,118)`.

The rows used the shared title, description, and Kbd anatomy. Relay diagnostics
recorded one connection attempt,
`feature-open -> connect-success -> socket-owned`, socket state `1`, zero
pending requests, and no transport or RPC error. Browser page errors were
empty.

Shared composition tests also prove that a `reload` query retains exactly
Reload app and Force reload app.

## Exact Native

The exact-owned production instance is:

- PID `29862`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- production session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `a4d57aa4973c9a423831c52af0c094b6d1dd3369fb6cadd10d3bfc5ed035ad21`;
- one established socket to `127.0.0.1:58090`.

Native DevTool found 53 shared shortcut rows. The final two rows contained:

- Reload app, description, and separate `⌘` / `R` Kbd pills;
- Force reload app, description, and separate `⌘` / `⇧` / `R` Kbd pills.

Each Native row retained the shared `622x59` border box. Fresh exact-client
warning/error console output was empty.

This slice does not re-trigger Cmd+R because behavior was already certified by
`shots/2026-08-18/native-cmd-r-reload/` and
`applicationMenu.lynx.test.ts`; the new loss was discoverability.

## Verification

- shared Web composition tests: `1 file / 4 tests`;
- Lynx settings/anatomy tests: `2 files / 12 tests`;
- Lynx-for-Web production build passed;
- complete Lynx/Desktop production build passed;
- no screenshots added; repository screenshot count remained `100`;
- browser ownership gate returned `sessions: []` and zero agent-browser-owned
  processes.
