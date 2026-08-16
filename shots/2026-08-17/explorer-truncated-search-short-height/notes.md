# Explorer Truncated Search at 320x200

## Newly discovered scope

A canonical workspace contained 100 files named `match-001.txt` through
`match-100.txt`. Searching for `match` in the ordinary Explorer at `320x200`,
DPR 1, dark returned:

- result count: `80`;
- first result: `match-001.txt`;
- last result: `match-080.txt`;
- canonical server flag: `truncated:true`.

This exercises the server's result cap rather than a visual list overflow.

## P1 product loss

Web authority renders a fixed narrowing hint whenever a non-empty result set is
truncated. Lynx retained the `ProjectSearchEntriesResult` type but discarded
its `truncated` flag when the router passed only `.entries` into the dock.

Before:

- 80 rows rendered;
- entries scroll height: `2246`;
- truncation hint count: `0`;
- no indication that 20 matching files were omitted.

`lynx-explorer-search-truncation-hidden`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

The canonical boolean now flows through:

`search RPC -> active thread data -> ThreadPage -> ordinary/Editor Explorer -> dock`.

For a non-empty truncated query, the dock shows:

`Showing top matches. Refine search.`

The shared footer is 22px normally and 14px in the short-height ordinary dock.
The truncated compact entries owner removes its 3px padding so one canonical
28px result remains fully visible above the footer.

## After evidence

- canonical result count: `80`;
- canonical `truncated:true`;
- entries owner:
  `158.5x29 @ (1,157)`;
- first row:
  `158.5x28 @ (1,157)`, bottom `185`;
- footer:
  `158.5x14 @ (1,186)`, bottom `200`;
- footer copy:
  `Showing top matches. Refine search.`;
- first row and footer are both fully inside the viewport;
- renderer-ready route:
  `/thread/thread-truncated-search-11`;
- relay transport/RPC errors: none.

A temporary after PNG was exactly `320x200`, SHA-256
`c6bb219371b4e176bb3e3ed71cee5f95a21ba1df93beea0e9678f2526079f89d`,
then deleted. No screenshot was retained.

## Harness boundary

Several intermediate after probes published an empty Lynx body despite a
healthy relay. One was a projection timing mismatch; a later one exposed a
real implementation error: the new ThreadPage prop was passed onward without
being destructured, causing a runtime reference failure. The prop contract was
completed and locked by the focused source test before retaining final
evidence. Failed probes were cleaned and were not scored as product frames.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4559.6 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `f7ab5a0174ac7713f5aa1bf876138371e4ee5e9093e800c4a795c7f06d853252`.
- Lynx-for-Web bundle SHA-256:
  `6545142f18bbe34bfb1c8cb4ddb6a7fdb4e8d33f5857acd31f6215504d8b5cd2`.
- Native cannot certify `320x200`; the build is supporting evidence only.
- The known environment-only Codex provider error is accepted noise.
- Every browser workflow used `bun run browser:run -- ...`; every failed probe
  was followed by an independent cleanup/session-list double-zero gate.
