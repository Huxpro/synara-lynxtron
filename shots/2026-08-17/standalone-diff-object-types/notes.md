# Git Object-Type Changes at 320x320

## Newly discovered scope

The object-type matrix used real Git repositories and covered:

- symlink target change (`120000`);
- regular file to symlink (`100644 -> 120000`);
- added gitlink/submodule entry (`160000`);
- unresolved three-stage index rendered by `git diff --cc`.

This was new scope after binary, lifecycle, rename, EOF, and quoted-path
coverage.

## P1 type-change lifecycle loss

Git represents a regular-file to symlink transition as two consecutive patch
segments with the same path:

1. `deleted file mode 100644`;
2. `new file mode 120000`.

Before the fix, parsed metadata used a single path-keyed lifecycle map. The
second segment overwrote the first, so both `node` cards rendered
`File added.`. The portable fallback already preserved deleted then added,
creating a canonical/fallback split.

`shared-diff-type-change-lifecycle-overwrite`: P1 component contribution
`1.00 -> 0.00`.

The parsed model now consumes lifecycle metadata as a per-path segment queue,
preserving `deleted -> added` source order.

## Combined-diff parser contract

`@pierre/diffs` accepted a real `diff --cc` patch as one file but projected no
lines. The shared composition therefore produced an expandable empty card.

Combined diffs have multiple parent columns and cannot be represented
faithfully by the current single-parent line-number model. They now fail over
to an explicit complete raw view:

`Combined merge diff has multiple parents. Showing the complete raw patch.`

The raw rows preserve:

- `diff --cc file.txt`;
- the combined object IDs;
- `@@@ -1,1 -1,1 +1,1 @@@`;
- all three parent/result-prefixed lines.

`shared-diff-combined-empty-card`: P1 parser contribution `1.00 -> 0.00`.

Standalone `git.readWorkingTreeDiff` uses
`git diff --patch --no-color --no-ext-diff HEAD`, which does not return the
manually requested `git diff --cc` shape for the constructed unmerged index.
Its canonical RPC returned a normal add patch instead. The rejected standalone
capture is therefore a harness/product-path mismatch, not combined-diff
renderer evidence. Combined raw rendering remains PR/external-patch renderer
missing coverage even though the shared projection contract is closed.

## Other object states

- Symlink target changes already rendered their old/new targets plus both EOF
  markers; product-loss contribution stayed `0.00`.
- Added gitlinks already rendered `Subproject commit <oid>` with
  `File added.`; product-loss contribution stayed `0.00`.
- A low-similarity regular-to-symlink transition correctly remains two patch
  segments; it is not flattened into a synthetic mode-only row.

## Final canonical renderer evidence

A real `293`-byte regular-to-symlink working-tree patch was opened through the
rendered Environment `Changes` row at `320x320`, DPR 1, dark. Both file
disclosures were expanded with real pointer activations.

- server instance:
  `805fdc8f-7aa7-43e9-9d0b-4da3fdc827d5`;
- pre-fixture Web/Lynx/Native snapshot sequence: `0`;
- post-fixture snapshot sequence: `2`;
- route: `/thread/thread-typechange-20260817`;
- first `node` header:
  `269x32 @ (26,98)`, `+0/-1`, expanded;
- first lifecycle notice:
  `File deleted.`, `269x16 @ (26,130)`;
- second `node` header:
  `269x32 @ (26,220)`, `+1/-0`, expanded;
- second lifecycle notice:
  `File added.`, `269x16 @ (26,252)`;
- old content: `regular`;
- new symlink target: `target`;
- both EOF markers remained present;
- root `clientWidth=scrollWidth=320`;
- pending requests returned to zero;
- page errors: none;
- PNG: exactly `320x320`, then deleted.

Programmatic `scrollIntoView` only positioned each file header before its real
pointer activation. It is setup evidence, not wheel or Native gesture
evidence.

## Harness and noise classification

- The first conflict capture did not expand the file card and was rejected.
- The second conflict capture proved that canonical
  `git.readWorkingTreeDiff` returned a normal add patch rather than the
  manually generated combined patch. It was rejected as a product-path
  mismatch.
- `provider.listModels` later reported `codex not found in PATH` in the
  isolated type-change run. This is accepted provider-discovery noise; Git RPC,
  transport, and the retained state remained healthy.
- Every browser workflow used `bun run browser:run -- ...`. Entry, failure,
  retained-cell, and exit gates returned `sessions: []` and zero
  agent-browser-owned processes. Ports `58090` and `8891` were free after
  cleanup.

## Validation

- Focused Web Vitest: `44/44` passed.
- Real projection checks passed for symlink, type-change, gitlink, and
  combined patches.
- Web production build passed with `8953` transformed modules.
- Web main asset SHA-256:
  `844311714c248e66218f5bf6ea2543471054602a265bfeeb5ebac62055348817`.
- Lynx-for-Web production build passed:
  `4588.7 kB`.
- Lynx-for-Web bundle SHA-256:
  `1d94e0642e4c758c2f36947a2da440e16014a4a1b4468cbc1ddf5d74c726d869`.
- Native/Desktop production build passed:
  `4293.6 kB`.
- Staged Native bundle SHA-256:
  `22029e8b76b9e3ccb1560f3d7fb0fdb39b12da542b395e48ada9530afbb3289d`.
- Native consumes the shared projection; exact-owned Native rendering remains
  batch certification scope.
- Final screenshot count remained `100`.
