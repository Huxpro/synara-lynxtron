# Explorer Reference Action at 320x200

## Newly discovered scope

The compact selected-file action menu had previously been measured but neither
action was activated. This cell executes `Reference in chat` for
`package.json` at `320x200`, dark.

## Interaction evidence

- deterministic selected file: `package.json`;
- real menu state: `explorerActionMenu=open`;
- agent-browser accessibility snapshot exposed:
  - `Reference in chat`;
  - `Ask why this changed`;
- `Reference in chat` was activated through its real `menuitem` ref;
- the popup closed.

After closing Explorer to expose the composer:

- textarea retained the structured mention placeholder;
- visible mention chip:
  `92.5625x19.5 @ (27,120.25)`;
- chip class: `ComposerChip ComposerChip--mention`;
- chip label: `package.json`;
- label width: `76.5625px`;
- composer visual flow remained in bounds.

This is a compact action product pass, contribution `0.00 -> 0.00`; no code
change was required.

## Harness boundary

- Direct `text=Reference in chat` lookup did not cross the Lynx accessibility
  layer. That failed probe was cleaned before the retained snapshot-ref path.
- The retained activation used the actual accessible menuitem ref and is real
  browser interaction evidence.
- Explorer Close used controlled DOM activation only to reveal the composer;
  it is not claimed as pointer evidence in this cell.
- Every browser workflow used `bun run browser:run -- ...` and ended with zero
  sessions/processes.
