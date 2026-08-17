# Diff Word Wrap Runtime at 320x320

## Newly discovered scope

A canonical tracked file changed from one short line to a 414-character line.
The same isolated server, thread, patch, route, viewport, and dark theme were
verified with diff word wrap off and on.

The setting changed through the real Lynx-for-Web host storage contract:

`synara.lynx.synara:app-settings:v1 -> {"diffWordWrap":true}`

The page then reloaded, hydrated through `storageDump`, and re-entered
Environment `Changes` through real pointer interactions.

## Wrap off

- class: `SharedPrCodeLines`;
- line text: `white-space: pre`;
- addition row:
  `2844.40625x20`;
- text:
  `2744.40625x20`;
- content width:
  `2844px`;
- horizontal overflow remained owned by the code-lines surface;
- outer scroller:
  `clientHeight=230`, `scrollHeight=230`;
- pending requests: `0`.

## Wrap on

- class:
  `SharedPrCodeLines SharedPrCodeLines--wrap`;
- line text: `white-space: pre-wrap`;
- addition row:
  `269x380`;
- text:
  `169x380`;
- content:
  `269/269` client/scroll width;
- outer scroller:
  `clientHeight=230`, `scrollHeight=530`;
- pending requests: `0`;
- page errors: none;
- PNG: exactly `320x320`, then deleted.

The setting changes horizontal overflow into vertical transcript ownership
without clipping or expanding the root width.

## Classification

- `standalone-diff-word-wrap-runtime`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

Raw fallback progressive disclosure was considered first, but standalone
`git.readWorkingTreeDiff` cannot construct arbitrary invalid or combined
external patches. PR/explicit raw renderer coverage remains open rather than
being simulated through DOM or SQLite.

## Harness identity

- final server instance:
  `a3a8dc94-145a-4a2b-a1e6-7f0441414102`;
- pre-fixture Web/Lynx/Native snapshot sequence: `0`;
- post-fixture sequence: `2`;
- route: `/thread/thread-wrap-20260817`;
- viewport: `320x320`, DPR 1, dark;
- transport errors: none;
- accepted noise:
  isolated `provider.listModels` reported `codex not found in PATH`;
- final pending requests: `0`.

The cell reused the validated final bundles from the control-path slice:

- Web main:
  `844311714c248e66218f5bf6ea2543471054602a265bfeeb5ebac62055348817`;
- Lynx-for-Web:
  `8fd915cebae2576cfa2f873fed0574f3cd2cadcb7d789137ea34b08b29c4df73`;
- Native:
  `bd591f4f553bfbac2d0bbe26d99e69b7ff80c34f1b2c5e386edec4657f03889f`.

Every browser attempt used the guarded wrapper. Entry, reload, failure retry,
and exit returned `sessions: []` with zero agent-browser-owned processes.
Screenshot count remained `100`.
