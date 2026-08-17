# Large Diff Collapse and Reopen at 320x200

## Newly discovered interaction state

A canonical 300-line file was expanded to 280 rendered rows through a real
`Show 160 more lines` activation. The file was then collapsed and reopened
through two real header pointer activations.

Programmatic scrolling only positioned the header/control before those trusted
interactions.

## Before collapse

- expanded: `true`;
- rendered rows: `280`;
- control: `Show 21 more lines`;
- scroller:
  `clientHeight=110`, `scrollHeight=5742`, `scrollTop=2432`;
- pending requests: `0`.

## Collapsed

- disclosure content unmounted;
- rendered rows: `0`;
- show-more controls: `0`;
- scroller:
  `clientHeight=110`, `scrollHeight=110`, `scrollTop=0`;
- pending requests: `0`.

## Reopened

- expanded: `true`;
- rendered rows restored to `280`;
- control restored as `Show 21 more lines`;
- scroller:
  `clientHeight=110`, `scrollHeight=5742`, `scrollTop=0`;
- pending requests: `0`;
- page errors: none;
- PNG: exactly `320x200`, then deleted.

The visible-line state survives disclosure unmount/remount, while the scroll
owner resets to a valid top position. No measure/scroll feedback loop appeared.

## Classification

- `standalone-diff-large-collapse-reopen`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

## Harness identity

- server instance:
  `e4dcf3e9-dc7c-4465-849b-60e19f6bf4d4`;
- pre-fixture Web/Lynx/Native snapshot sequence: `0`;
- post-fixture sequence: `2`;
- route: `/thread/thread-reopen`;
- viewport: `320x200`, DPR 1, dark.

The cell reused the validated final bundles from the control-path slice.
Entry, failed timing attempt, retained cell, and exit each returned
`sessions: []` with zero agent-browser-owned processes.
