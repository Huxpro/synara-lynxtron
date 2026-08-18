# Settings Archived Populated Current

## Classification

- New scope: Settings Archived × populated archived thread × dark ×
  `1280x820` × Restore/Delete actions.
- Missing coverage:
  `settings-archived-populated-actions-current`, `1.00 -> 0.00`.
- Product pass: populated row geometry and both action controls match the
  shared Web authority.
- Harness loss: the first rearchive retry used a fresh-page relative dynamic
  module specifier that failed to resolve. The loop stopped, `browser:gate`
  passed, and the fixture was restored through the absolute same-origin module
  URL before any further work.

## Prior Coverage

The earlier current-head Archived evidence certified only:

- empty light `1280x820`;
- empty dark `1440x900`;
- the initial canonical projection and Restore implementation.

The current implementation later gained permanent Delete with Native
confirmation. Populated row/action behavior had not been certified on current
head.

## Canonical Fixture

Web authority used the real `createWsNativeApi()` product path:

1. `thread.create`;
2. `thread.archive`;
3. rendered Lynx Restore;
4. canonical `thread.archive` to restore the fixture for Native inspection;
5. canonical `thread.delete` cleanup.

Fixture:

- thread:
  `thread-fidelity-archived-1787025116883`;
- title:
  `Fidelity Archived 1787025116883`;
- project:
  `1d01802b-84d1-4f75-9c88-d84bb661107c`.

Final shell snapshot returned `exists:false`. No SQLite write was used.

## Web And Lynx-for-Web

Both clients used dark theme, `1280x820`, DPR `1`, the same server, snapshot,
project, thread, and archive state.

Owner-aligned geometry was exact:

- Web archived row:
  `622x58 @ (457,151)`;
- Lynx archived row:
  `622x58 @ (457,151)`;
- Restore:
  `53.89x24 @ (957.22,168)` in both;
- Delete:
  `47.89x24 @ (1019.11,168)` in both.

Lynx controls exposed explicit Native names:

- `Restore Fidelity Archived 1787025116883`;
- `Delete Fidelity Archived 1787025116883`.

A real rendered-coordinate Lynx-for-Web Restore removed the row. The fixture
was then canonically rearchived for Native inspection.

Relay diagnostics recorded one connection attempt,
`feature-open -> connect-success -> socket-owned`, socket state `1`, zero
pending requests, and no transport/RPC error. Browser page errors were empty.

## Exact Native

The exact-owned production instance is:

- PID `95360`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- production session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `bed3432d17492c8a8ba77267718c1475dde1a8df15466069d2715ca59191ce25`;
- one established socket to `127.0.0.1:58090`.

Native DevTool proved both current actions:

- Restore: complete button anatomy, explicit name, `53.89x24`;
- Delete: destructive button anatomy, explicit name, `47.89x24`.

Fresh exact-client warning/error console output was empty. Delete was not
activated through the Native confirmation dialog because the canonical cleanup
path independently removed the fixture without introducing a foreground
system-dialog dependency.

## Verification

- focused Archived grouping/command/panel tests pass;
- previously built current production Web and Lynx/Desktop bundles were used;
- fixture canonical deletion passed;
- no screenshots added; repository screenshot count remained `100`;
- every failed browser workflow was followed by a clean ownership gate.
