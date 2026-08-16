# Explorer Long Source Line at 320x200

## Newly discovered scope

A canonical project/thread selected `long-line.json` from a real temporary
workspace. The file contained one JSON line with a 500-character unbroken
string and was rendered by the ordinary Explorer at `320x200`, dark.

The content loaded through `projects.readFile` and used JSON syntax
highlighting. No SQLite fixture or fabricated preview state was used.

## P1 product loss

Before the fix:

- preview scroller: `151.5x32`, `overflow-x:hidden`, `scrollWidth=152`;
- code: `117.5x17`, `white-space:pre`, `overflow-x:clip`;
- source length: 512 characters.

The Lynx scroll owner is vertical-only in this branch. Almost all of the
unbroken line was therefore clipped with no horizontal interaction path.

`lynx-explorer-source-long-line-clipped`: P1 component contribution
`1.00 -> 0.00`.

## Authority and root fix

Web authority makes selected source content horizontally scrollable. Because
the current Lynx preview has no horizontal scroll owner, the compact fallback
wraps syntax content only in short-height ordinary Thread Explorer:

- `white-space: pre-wrap`;
- `word-break: break-word`.

Normal-height source rendering, Editor Explorer, file loading, and syntax
highlighting remain unchanged.

## After evidence

- preview scroller: `151.5x32 @ (164.5,164)`;
- scroller `scrollHeight=544`;
- syntax container: `151.5x544`;
- line: `151.5x527`;
- code: `117.5x527`;
- resolved `white-space:pre-wrap`;
- resolved `word-break:break-word`;
- horizontal `scrollWidth=clientWidth`;
- relay: one connection, zero pending requests, no transport/RPC error;
- canonical `projects.readFile` completed;
- syntax-highlight language: `json`.

The complete source is now reachable through the existing vertical scroll
owner. A temporary PNG was exactly `320x200`, SHA-256
`7183ad0880f80593154eb172b308528d42890b59436f5afe806648543704923d`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4554.6 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `13934e6bef87187def5dca8be757b3aa19ff8a23b10bffbe2d46d413e5f2e509`.
- Native cannot certify the `320x200` viewport; the production build is
  supporting bundle evidence only.
- This cell proves content reachability and measured scroll range. It does not
  relabel programmatic scrolling as wheel or gesture evidence.
- Every browser workflow used `bun run browser:run -- ...`.
- Loop entry and post-probe gates independently ran
  `bun run browser:cleanup` plus
  `bun run browser:run -- agent-browser session list --json`; both reported
  `sessions: []` and zero agent-browser-owned processes.
