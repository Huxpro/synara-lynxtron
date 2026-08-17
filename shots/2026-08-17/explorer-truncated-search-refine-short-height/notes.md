# Explorer Truncated Search Refine at 320x200

## Newly discovered scope

A canonical 100-file workspace opened the compact ordinary Explorer with query
`match`, yielding the previously verified `80` results and truncation footer.

This cell executes the follow-up instruction in that footer rather than only
measuring its static presentation.

## Trusted interaction evidence

The real Lynx search input was published through the browser accessibility
snapshot as:

`textbox "Search files..." [ref=e1]: match`

`agent-browser fill` changed it to `match-100`. After the product query settled:

- result count: `1`;
- result: `match-100.txt`;
- result row: `152.5x28 @ (4,160)`, bottom `188`;
- entries owner: `158.5x43 @ (1,157)`;
- truncation footer: unmounted;
- entries scroll height: `43`;
- relay issued a new `projects.searchEntries`.

The truncation state correctly clears when refinement removes the server cap.
This is a compact interaction pass, contribution `0.00 -> 0.00`; no code
change was required.

## Harness boundaries

- The first workflow exposed the valid input ref but expected the wrong
  `searchbox` role/label and stopped before interaction.
- That failed probe was cleaned before the retained exact-ref path.
- No DOM activation or programmatic query mutation was used.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
