# Standalone No-Newline Changes at 320x200

## Newly discovered scope

A canonical Git working-tree patch with an EOF marker was opened in standalone
Changes at `320x200`, DPR 1, dark:

- file: `note.txt`;
- old bytes: `before\ntail`;
- new bytes: `after\ntail`;
- neither version ends with a newline;
- canonical patch length: `158` bytes;
- entry: real pointer activation of the rendered Environment `Changes` row;
- expansion: real pointer activation of the rendered `note.txt` file header.

Project and thread setup used `orchestration.dispatchCommand`. The isolated
SQLite projection was never edited.

## P1 shared product loss

Web authority's `@pierre/diffs` model preserves Git EOF markers through
`noEOFCRAdditions` / `noEOFCRDeletions` and renders a dedicated
`data-no-newline` row. The shared portable model used by Lynx previously
discarded every `\ No newline at end of file` marker.

The loss affected three distinct canonical placements:

- after a deletion row;
- after an addition row;
- after a shared context row when both old and new files lack the final
  newline.

Before the fix, the last case projected only hunk, deletion, addition, and
`tail` context rows. The EOF identity was absent.

`shared-diff-no-newline-identity-missing`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

- `PullRequestDiffLineKind` now has explicit no-newline variants for addition,
  deletion, and context ownership.
- The parsed projection derives marker placement from the original patch and
  inserts each marker immediately after its owning row.
- The pure-string fallback preserves the same order rather than skipping the
  marker.
- Shared Web and Lynx row elements render a `\` prefix and muted italic text.
- Real patches with direct replacement, shared trailing context, and a path
  containing spaces all retain the expected marker identity.

No renderer-specific file-level approximation was added.

## Final Lynx-for-Web evidence

The retained logical cell used the final production bundle:

- Web/Lynx/Native preflight shared server instance
  `1a7f98e7-40df-4e03-ab25-ae70189afc60`;
- pre-fixture snapshot sequence: `0` for all three probes;
- canonical post-fixture snapshot sequence: `2`;
- route: `/thread/thread-no-newline-20260817`;
- root:
  `SliceRoot--theme-dark SliceRoot--viewport-compact SliceRoot--viewport-short-height`;
- viewport and visual viewport: `320x200`, DPR `1`;
- dock: `320x154 @ (0,46)`;
- scroller: `319x110 @ (1,90)`, `clientHeight=110`,
  `scrollHeight=210`;
- file header: `269x32`;
- context EOF row:
  `277x20 @ (26,155)`, ending at `175`;
- row text: `\No newline at end of file`;
- computed style: muted `rgba(252, 252, 252, 0.58)`, italic;
- root `clientWidth=scrollWidth=320`;
- pending requests returned to zero;
- page errors: none;
- PNG dimensions: exactly `320x200`, then deleted.

The scroller was set to its maximum programmatically only to place the final
row in the retained frame. This is anatomy/setup evidence, not wheel or native
gesture evidence.

## Harness and noise classification

- A first real patch inherited colored Git output. It was rejected as a fixture
  mismatch and regenerated with `--no-color`.
- One canonical RPC attempt wrapped the command in an extra payload object.
  No state was created; it was a harness schema failure.
- Several browser attempts reached the correct file header but passed a
  fractional center coordinate to `agent-browser mouse move`, whose CLI
  accepts integer coordinates. They were harness parsing failures, not product
  losses.
- A requested dark appearance applied after initial render left a light root.
  That cell was rejected as a theme mismatch. The final cell launched with
  `--color-scheme dark` and asserted the dark root class.
- `provider.listModels` reported `codex not found in PATH` in the isolated
  environment after product evidence was complete. This is accepted provider
  discovery noise; transport stayed connected, Git RPCs succeeded, pending
  requests returned to zero, and page errors were empty.
- Every failed or successful browser workflow ran through
  `bun run browser:run -- ...`. Entry, failure, retained-cell, and exit gates
  all independently returned `sessions: []` and zero agent-browser-owned
  processes. Owned ports `58090` and `8891` were free after cleanup.

## Validation

- Web focused Vitest: `9/9` passed.
- Lynx shared-composition Rstest: `1/1` passed.
- Web production build passed with `8953` transformed modules.
- Web main asset SHA-256:
  `13904f43717d725876cce07ee3e2e4bf55445dbc3b99491d3bc62bc9ae4b4266`.
- Lynx-for-Web production build passed:
  `4585.5 kB`.
- Lynx-for-Web bundle SHA-256:
  `5340d268fab5f906fefcddce1c6da9da3d3b9655180606115ca524837733204a`.
- Native/Desktop production build passed:
  `4290.9 kB`.
- Staged Native bundle SHA-256:
  `26a4df3d90f6a741b142c4c6463e52709ab0931303cc7c6a537d62bbe64e37d3`.
- Native consumes the same shared source and completed a production build.
  Exact-owned Native row rendering and gesture behavior remain batch
  certification scope; they are not claimed by the Web capture.
- Final local screenshot count remained `100`.
