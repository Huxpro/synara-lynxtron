# Explorer Markdown at 320x200

## Newly discovered scope

The repository `README.md` was selected through a canonical project/thread in
the ordinary compact Explorer at `320x200`, dark. This exercises the shared
`ChatMarkdown` renderer rather than syntax, PDF, or image preview.

## P1 product loss

Before the fix:

- preview: `159.5x80`;
- selected-file header: 40px;
- content: `159.5x40`;
- Markdown scroll owner: `151.5x32`, `scrollHeight=3150`;
- first H1: `151.5x30 @ (164.5,179)`, bottom `209`.

The scroll owner existed, but the initial viewport could not show one complete
content block.

`lynx-explorer-markdown-compact-preview-collapsed`: P1 contribution
`1.00 -> 0.00`.

## Root fix

Markdown selection adds a compact preview modifier. At short height only:

- the duplicate filename path hides;
- More actions becomes a 28px overlay;
- content uses the full preview height with 2px padding.

The shared `ChatMarkdown` tree, links, tokens, and scroll owner are unchanged.

## After evidence

- preview: `159.5x80 @ (160.5,120)`;
- More actions: `28x28 @ (288,124)`;
- content: `159.5x80`;
- Markdown scroll: `155.5x76 @ (162.5,122)`,
  `scrollHeight=3087`;
- first H1: `155.5x30 @ (162.5,137)`, bottom `167`;
- relay used `projects.listDirectories` and `projects.readFile`;
- Markdown syntax classification succeeded.

A temporary PNG was exactly `320x200`, SHA-256
`7be444aaff52e1e38bba1a875b97eb97953118d4fb868d6bfd997015e8bb7b23`,
then deleted.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4548.6 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `36263b81f580de9a4001d8703d3b5fbeb46b241724b12301307944527432d1df`.
- Native cannot certify `320x200`; the build is supporting evidence only.
- Every browser workflow used `bun run browser:run -- ...` and ended with zero
  sessions/processes.
