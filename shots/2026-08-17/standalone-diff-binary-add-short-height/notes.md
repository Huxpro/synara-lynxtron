# Standalone Binary Addition at 320x200

## Newly discovered scope

A real newly added binary file produced a combined canonical patch:

- `new file mode 100644`;
- `Binary files /dev/null and b/new.bin differ`.

The standalone Changes file was opened and expanded with real mouse input at
`320x200`, DPR 1, dark.

## P1 product loss

The shared model correctly rendered both semantic notices, but the compact
standalone disclosure used normal `12px/16px` notice rhythm:

- `Binary file changed.`: `y=175..191`;
- `File added.`: `y=191..207`.

The second identity crossed the `200px` viewport boundary.

`lynx-compact-combined-diff-notice-overflow`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Only short-height standalone DiffDock notices now use `10px/12px` typography.
Normal sizes, Editor Changes, Web, and warning colors remain unchanged.

## After evidence

- `Binary file changed.`: `y=175..187`;
- `File added.`: `y=187..199`;
- both notices: `269px` wide;
- scroller: `clientHeight=110`, `scrollHeight=134`;
- pending requests: `0`.

## Validation

- Lynx shared-composition Rstest: `1/1` passed.
- Lynx-for-Web production build passed: `4569.4 kB`.
- Web bundle SHA-256:
  `f1bfdeacbd0cd8fe55e5a18ae97971550513ca31bd648d8ba97b851866378fef`.
- Native/Desktop production build passed: `4277.8 kB`.
- Staged Native bundle SHA-256:
  `ff44fa10edf508cd70beccb5e88a6d1afd6d5531a69239f3c21ef97f0346e947`.
- One after attempt referenced a temporary script already removed by cleanup
  and produced no evidence; the explicit double-zero gate ran before the fresh
  retained after loop.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  removed state/workspace, and repository screenshot count `100`.
