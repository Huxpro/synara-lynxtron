# Copy Relation Identity

## Newly discovered scope

The structural patch matrix added:

- 100%-similarity copy (`copy from` / `copy to`);
- gitlink update and delete;
- symlink add;
- a filename containing a literal newline.

Gitlink, symlink, and newline-path projections were already complete in both
canonical and portable models.

## P1 product loss

A copy patch previously produced:

- path: `copied.txt`;
- previous path: `original.txt`;
- header copy: `from original.txt`.

That presentation was indistinguishable from rename identity even though the
source file still exists.

`shared-diff-copy-relation-missing`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

- `PullRequestDiffFileView` now carries
  `relation: copied | renamed | null`.
- Canonical projection derives relation metadata from the original patch as a
  per-path segment queue.
- Portable fallback recognizes and decodes `copy from/to` and `rename from/to`.
- Shared Web and Lynx headers now render `copied from <path>` or
  `renamed from <path>`, retaining plain `from` only for unknown relations.

The model does not infer copy from path differences alone.

## Executable renderer evidence

The focused Lynx element-tree suite rendered the real
`PullRequestCodeFileHeaderElement` twice:

- copied:
  `copied from original.txt`;
- renamed:
  `renamed from original.txt`;
- both preserved the `Expand result.txt` accessibility identity.

This is executable renderer evidence, not a source-string-only claim.

Standalone `git.readWorkingTreeDiff` uses a normal
`git diff --patch ... HEAD` plus synthesized untracked patches. It does not
enable Git copy detection, so the same workspace copy becomes a normal
new-file patch. A standalone browser cell cannot honestly certify copy
relation. PR/explicit-copy browser rendering remains missing coverage.

## Other structural states

- Gitlink update preserved both `Subproject commit <oid>` lines.
- Gitlink delete preserved `File deleted.` and the previous commit.
- Symlink add preserved `File added.`, target text, and EOF identity.
- A path containing a literal newline decoded back to the real filename and
  retained both EOF markers.

These states contributed `0.00` product loss.

## Validation

- Focused Web Vitest: `45/45` passed.
- Focused Lynx Rstest: `3/3` passed, including two executable relation cases.
- Web production build passed with `8953` transformed modules.
- Web main asset SHA-256:
  `844311714c248e66218f5bf6ea2543471054602a265bfeeb5ebac62055348817`.
- Lynx-for-Web production build passed:
  `4590.6 kB`.
- Lynx-for-Web bundle SHA-256:
  `5a4b23d05b3ae243d2b94ef83adb9196650adf8d9f36cc880378830c6a78627f`.
- Native/Desktop production build passed:
  `4295.5 kB`.
- Staged Native bundle SHA-256:
  `f2e4a9d006d1420a69ad4f8e819a64131ed79267f6cdd826c48c1df0a2ae159c`.
- Browser lifecycle entry and exit gates returned `sessions: []` and zero
  agent-browser-owned processes.
- Screenshot count remained `100`; no screenshot was retained for an
  unconstructable standalone copy state.
