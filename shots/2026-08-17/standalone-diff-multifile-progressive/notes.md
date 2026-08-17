# Multi-File Progressive Isolation at 320x320

## Newly discovered state

Two canonical files each changed from empty to 200 lines. Both file
disclosures were expanded with real pointer interactions.

## Baseline

- `a.txt`: `120` rows, `Show 81 more lines`;
- `b.txt`: `120` rows, `Show 81 more lines`;
- both disclosures: expanded;
- pending requests: `0`.

The show-more control for `a.txt` was positioned with programmatic
`scrollIntoView` and then activated with a real pointer.

## After expanding only a.txt

- `a.txt`: `201` rows (one hunk plus 200 additions), no show-more control;
- `b.txt`: unchanged at `120` rows and `Show 81 more lines`;
- both disclosures remained expanded;
- page errors: none;
- PNG: exactly `320x320`, then deleted.

The `visibleLineCounts` state stayed keyed by file identity; expanding one file
did not mutate or remount the other.

## Classification

- `standalone-diff-multifile-progressive-isolation`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

## Harness

- server instance:
  `54794c84-354b-4534-a083-60905845539b`;
- pre-fixture Web/Lynx/Native snapshot sequence: `0`;
- post-fixture sequence: `2`;
- route: `/thread/thread-multi`;
- viewport: `320x320`, DPR 1, dark.

One helper attempt failed before product interaction because a shell local was
referenced in the same declaration that initialized it. Failure cleanup and
the retained run both returned `sessions: []` with zero agent-browser-owned
processes.
