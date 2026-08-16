# Explorer Empty Source at 320x200

## Newly discovered scope

A canonical project/thread selected `empty.txt`, a real zero-byte file, in the
ordinary Explorer at `320x200`, DPR 1, dark.

`projects.readFile` succeeded with:

- content length: `0`;
- `truncated:false`;
- no transport or RPC error.

This differs from missing, binary, truncated, and failed-read states.

## P1 product loss

Before the fix, both Web authority source and Lynx treated a successful
zero-byte read as an empty code surface with no state copy.

Lynx evidence:

- header: `empty.txt`;
- preview content: `159.5x40 @ (160.5,160)`;
- scroller: `151.5x32 @ (164.5,164)`;
- code element: `151.5x0`;
- visible state count: `0`;
- visible result: an unexplained blank preview.

`explorer-empty-file-indistinguishable`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Successful zero-byte reads now render `Empty file.` before source/Markdown
rendering:

- Web uses the shared compact `PanelStateMessage`;
- Lynx uses the shared `ExplorerDockState`;
- loading, read errors, binary failures, non-empty source, and local
  image/PDF paths remain unchanged.

This is a shared product correction rather than copying the Web blank-state
bug into Lynx.

## After evidence

The same canonical empty file now renders:

- preview content: `159.5x40 @ (160.5,160)`;
- state: `59.9375x18 @ (210.28125,171)`;
- state bottom: `189`;
- copy: `Empty file.`;
- source scroller/code: unmounted;
- renderer-ready route: `/thread/thread-empty-source-2`;
- transport/RPC errors: none.

A temporary after PNG was exactly `320x200`, SHA-256
`060a78d5828629e682b3f08519dcc426eec7a748ea3092608c11a83128bb7144`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Focused Lynx Rstest passed `2/2`.
- Focused Web Vitest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4560.1 kB`.
- Web production build passed with `8953` modules.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `f6060bc2a0fb8063355f73cb82a1c4fd2f3c3cd921624708a99446ddccc0d557`.
- Lynx-for-Web bundle SHA-256:
  `7be8f1f91f7f236b4caf97acd5a26725cccbf860c963a9c207e864852790ac77`.
- Web production `index.html` SHA-256:
  `0a4879acd4ecdd6a006fb5515c626ad72feed0085903143f8bc72514826b6dd2`.
- Exact Web runtime hydration remains unavailable in this isolated compact
  route, so Web source, focused rendering contract, and production build are
  supporting evidence rather than a fresh Web runtime frame.
- Native cannot certify `320x200`.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
