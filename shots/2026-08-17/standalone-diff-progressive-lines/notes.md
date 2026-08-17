# Progressive Large Diff at 320x200

## Newly discovered scope

A canonical tracked file changed from empty to 300 lines. Standalone Changes
was opened at `320x200`, DPR 1, dark through the rendered Environment row, and
the file disclosure was expanded with a real pointer.

This was the first retained coverage of the shared `120 + 160` progressive
line disclosure contract.

## Initial state

- rendered rows: `120`;
- scroller:
  `clientHeight=110`, `scrollHeight=2542`;
- control:
  `Show 160 more lines`;
- the control was positioned with programmatic `scrollIntoView` only for
  interaction setup.

## First real Show-more activation

- rendered rows: `280`;
- scroller:
  `clientHeight=110`, `scrollHeight=5742`;
- next control:
  `Show 21 more lines`;
- pending requests: `0`.

The remaining count is correct because the portable model contains one hunk
row plus 300 addition rows.

## Second real Show-more activation

- rendered rows: `301`;
- show-more controls: `0`;
- scroller:
  `clientHeight=110`, `scrollHeight=6130`;
- pending requests: `0`;
- page errors: none;
- PNG: exactly `320x200`, then deleted.

## Classification

- `standalone-diff-progressive-large-file`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

Programmatic positioning is setup only. Both progressive state changes used
real pointer activations of the rendered control. This evidence does not claim
wheel or Native gesture behavior.

## Harness identity

- final server instance:
  `0cb27341-345f-428d-8f75-f9639a891727`;
- pre-fixture Web/Lynx/Native snapshot sequence: `0`;
- post-fixture sequence: `2`;
- route: `/thread/thread-large-20260817`;
- viewport and PNG: `320x200`, DPR 1;
- transport and RPC errors: none.

The cell reused the validated final bundles from the control-path slice:

- Web main:
  `844311714c248e66218f5bf6ea2543471054602a265bfeeb5ebac62055348817`;
- Lynx-for-Web:
  `8fd915cebae2576cfa2f873fed0574f3cd2cadcb7d789137ea34b08b29c4df73`;
- Native:
  `bd591f4f553bfbac2d0bbe26d99e69b7ff80c34f1b2c5e386edec4657f03889f`.

Entry, intermediate, and exit browser gates returned `sessions: []` with zero
agent-browser-owned processes. Screenshot count remained `100`.
