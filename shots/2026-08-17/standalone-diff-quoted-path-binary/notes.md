# Quoted Paths and Literal Binary Changes at 320x200

## Newly discovered scope

Active discovery enumerated Git's default path quoting rather than repeating
the ordinary ASCII diff states:

- non-ASCII path: `文档.txt`;
- embedded quote path: `say"hi.txt`;
- tab path: `tab\tname.txt`;
- ordinary path containing the header separator text: `foo b/bar.txt`;
- ambiguous rename:
  `foo b/old.txt -> foo b/new.txt`;
- literal binary patch: `文档.bin`.

Git emitted C-style quoted paths for the first three and an unquoted ambiguous
`diff --git a/foo b/... b/foo b/...` header for the separator case.

## P1 quoted-path product loss

Before the fix:

- Web/shared file identity exposed Git escape text such as
  `\346\226\207\346\241\243.txt` instead of `文档.txt`;
- quote and tab filenames remained backslash escaped;
- quoted headers bypassed the portable fallback and every metadata scanner;
- EOF identity was lost again for quoted files;
- a real unquoted `foo b/bar.txt` header was split at the wrong ` b/`;
- ambiguous pure rename paths were truncated in the fallback.

`shared-diff-quoted-path-identity`: P1 component contribution
`1.00 -> 0.00`.

## P1 literal-binary product loss

A real modified binary file emitted:

```text
GIT binary patch
literal 2
...
```

The existing binary support recognized only
`Binary files ... differ`. Before the fix, both parsed and fallback models
reported `文档.bin +0/-0`, `binary:false`, with no disclosure body.

`shared-diff-literal-binary-identity`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

- Shared `decodeGitPath` decodes Git C-style escapes as UTF-8 bytes, including
  octal bytes, quotes, tabs, and backslashes.
- Shared `parseGitDiffHeader` is now the single path authority for the portable
  parser and binary/mode/lifecycle/EOF metadata scanners.
- Unquoted headers enumerate separator candidates and prefer the candidate
  whose old/new paths are identical, preserving names containing ` b/`.
- `rename from` / `rename to` metadata overrides an inherently ambiguous
  rename header and is decoded through the same path helper.
- `resolveFileDiffPath` now presents decoded filenames for Web authority and
  shared compositions.
- Both canonical and fallback projections recognize `GIT binary patch`.

Real matrices passed for:

- unicode, quote, and tab EOF patches;
- unicode mode changes and empty-file lifecycle;
- unicode literal binary patches;
- quoted pure rename;
- unquoted ` b/` path identity;
- ambiguous pure rename;
- low-similarity rename represented by Git as separate add/delete patches.

## Final two-phase renderer evidence

Both phases used one canonical `510`-byte working-tree patch, one isolated
server, one snapshot, dark theme, `320x200`, DPR 1:

- server instance:
  `96482193-aa3c-4af1-85f2-ec653bbd2dc3`;
- pre-fixture Web/Lynx/Native snapshot sequence: `0`;
- post-fixture snapshot sequence: `2`;
- route: `/thread/thread-quoted-20260817`;
- headers:
  `文档.bin +0/-0` and `文档.txt +1/-1`;
- root:
  `SliceRoot--theme-dark SliceRoot--viewport-compact SliceRoot--viewport-short-height`;
- root `clientWidth=scrollWidth=320`;
- pending requests returned to zero;
- page errors: none.

### Text-expanded phase

After a real pointer activation of `文档.txt`, programmatic scroll was used
only to place its EOF rows in the retained viewport:

- deletion EOF row: `277x20 @ (26,115)`, ending at `135`;
- addition EOF row: `277x20 @ (26,155)`, ending at `175`;
- both rows rendered `\No newline at end of file`;
- PNG: exactly `320x200`, then deleted.

### Binary-expanded phase

The binary header was positioned with programmatic `scrollIntoView`, then
activated with a real pointer:

- `文档.bin` header: `269x32 @ (26,129)`;
- `Binary file changed.`:
  `269x12 @ (26,161)`, ending at `173`;
- scroller: `319x110 @ (1,90)`, `scrollTop=14`;
- PNG: exactly `320x200`, then deleted.

Programmatic positioning is setup/anatomy only. It is not retained as wheel or
Native gesture evidence.

## Harness and noise classification

- One helper selected no Environment element when its optional text filter was
  empty. The run stopped before product interaction.
- A second helper decoded UTF-8 search text with raw `atob`, so it could not
  match `文档.txt`. The run stopped before the file interaction.
- Early successful runs proved the binary state but left the text EOF rows
  outside the viewport or collapsed. Those were not accepted as visual EOF
  evidence.
- The final workflow added hard assertions for two visible EOF rows and a
  visible binary notice before retaining temporary PNGs.
- `provider.listModels` reported `codex not found in PATH` in the isolated
  environment. This remains accepted provider-discovery noise: transport and
  Git RPCs succeeded, pending requests returned to zero, and page errors were
  empty.
- Every browser workflow ran through `bun run browser:run -- ...`. Entry,
  failure, retained-phase, and exit checks independently returned
  `sessions: []` and zero agent-browser-owned processes. Owned ports `58090`
  and `8891` were free after cleanup.

## Validation

- Focused Web Vitest: `42/42` passed across `diffRendering` and the portable
  pull-request code model.
- Web production build passed with `8953` transformed modules.
- Web main asset SHA-256:
  `844311714c248e66218f5bf6ea2543471054602a265bfeeb5ebac62055348817`.
- Lynx-for-Web production build passed:
  `4587.9 kB`.
- Lynx-for-Web bundle SHA-256:
  `f1dc2a1f41cf8ce3b5acdcc866d10cd4f1ca08fd2416e686533ab92ba9a32865`.
- Native/Desktop production build passed:
  `4292.7 kB`.
- Staged Native bundle SHA-256:
  `5f712843350d8e2bf3687d912ddd9f874070e7aa0fb19baec3f0191f994836a2`.
- Native consumes the same shared parser/model. Exact-owned Native rendering
  remains batch certification scope rather than a claim from Lynx-for-Web.
- Final local screenshot count remained `100`.
