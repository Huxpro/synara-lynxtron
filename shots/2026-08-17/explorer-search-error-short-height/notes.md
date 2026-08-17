# Explorer Search Error at 320x200

## Newly discovered scope

A canonical project/thread was created against a real workspace. The workspace
root was then removed before opening the ordinary compact Explorer with query
`needle`.

The direct canonical `projects.searchEntries` call failed. This differs from
the previously covered root `projects.listDirectories` failure because the
non-empty query selected the fuzzy-search RPC path.

## Product evidence

The failure remained local and fully visible:

- entries owner: `158.5x43 @ (1,157)`;
- error: `112.828125x18 @ (23.828125,169.5)`;
- error bottom: `187.5`;
- copy: `Could not load files.`;
- empty preview copy remained in bounds;
- renderer-ready route: `/thread/thread-search-error`;
- relay pending requests: `0`;
- transport error: null.

This is a compact search failure-boundary pass, contribution `0.00 -> 0.00`;
no product code change was required.

## Classification and boundaries

- The stable user copy intentionally does not expose the raw workspace path or
  filesystem error.
- Search failure did not degrade to `No matching files.`.
- The known environment-only Codex provider failure is accepted noise.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
