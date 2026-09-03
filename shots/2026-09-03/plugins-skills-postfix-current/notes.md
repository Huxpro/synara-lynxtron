# Plugin Library Skills post-fix recapture

Status: retained matched Web-original and Lynx-for-Web evidence after the
search, header, provider, badge, and grid corrections.

## Identity

- Product commit: `9acfac241` (`fix(lynx): match plugin skills grid rhythm`).
- Backend: `ws://127.0.0.1:58441`; server instance
  `6cea089d-503f-4b89-88fb-d82268081e7d`.
- Snapshot SHA-256:
  `aee78d756003f3aea93b12082733450cc100750b9b454b09cf27c9278e57bc09`.
- Route/state: `/plugins`, Skills tab, Codex provider, complete shared skill
  catalog, default expanded `github` project, no provider-update prompt.
- Viewport: light `1280x820`, DPR 1; both PNGs are exactly `1280x820`.
- Endpoint-pinned Lynx-for-Web bundle SHA-256:
  `7b55203283941ac98c85edc6058d476d08b4bd10a5f725fbe4c16204c51cb110`.

Both clients selected Skills through the rendered tab and dismissed the same
provider-update prompt through a real pointer action. No route, catalog, or
renderer-local state was injected after load.

## Result

- Current RGB MAE: `1.1908321128248047%`.
- Replaced current committed pair: `2.123356298820341%`.
- Header regional MAE fell from the pre-header-fix `8.042879391339868%` to
  `2.522122651143791%`.
- Grid regional MAE fell from `3.30925884446916%` to
  `1.1056382418163344%` after removing the stale 10px gutter and matching the
  section rhythm.
- The active Codex pill now uses the Electron-equivalent white label and icon
  paint on the foreground fill.
- Both page-error buffers are empty.
- Lynx relay connected on its first attempt, reported `/plugins`, had zero
  pending unary requests, and reported no transport or RPC error. Its only
  active request was the expected `terminal.subscribeEvents` stream.

## Discarded diagnostics

Earlier attempts in this loop were not retained: one Web frame captured the
startup splash; another pair mixed expanded and collapsed project state; and
one Web frame retained a project hover card/text selection. None contributes
to the ledger.

## Verification

- Plugin Library and provider-icon focused tests: `5/5`.
- ReactLynx best-practices scans for the page and provider icon: zero findings.
- Committed-tree endpoint-pinned `build:web`: passed.
- Browser entry, retry, capture, and exit gates: zero sessions and zero owned
  browser processes.
