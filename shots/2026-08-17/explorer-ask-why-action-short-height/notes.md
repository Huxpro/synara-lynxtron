# Explorer Ask Why Action at 320x200

## Newly discovered scope

The compact selected-file menu's second action had not been executed. This cell
activates `Ask why this changed` for `package.json` at `320x200`, dark.

## Interaction evidence

- real accessible menuitem ref: `Ask why this changed`;
- agent-browser activated the menuitem;
- Explorer was then hidden with controlled DOM activation to expose the
  composer;
- structured mention chip:
  `92.5625x19.5 @ (154.984375,120)`;
- chip class: `ComposerChip ComposerChip--mention`;
- chip label: `package.json`;
- projected prompt:
  `Why did we implement package.json this way? Check the git history if needed and explain the reasoning.`;
- textarea preserves the structured mention placeholder between
  `Why did we implement` and `this way?`.

This is a compact action product pass, contribution `0.00 -> 0.00`; no code
change was required.

## Boundaries

- The menuitem activation is real browser accessibility interaction evidence.
- Explorer Close is controlled DOM activation only and is not claimed pointer
  evidence.
- Every browser workflow used `bun run browser:run -- ...` and ended with zero
  sessions/processes.
