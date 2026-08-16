# Explorer PDF Page Load Failure at 320x200

## Newly discovered scope

A canonical project/thread selected a valid two-page PDF in the ordinary
Explorer at `320x200`, DPR 1, dark.

The server returned `pageCount:2`, and page 1 rendered through the real
`/api/local-pdf-page` path with HTTP `200`. The owned fixture was then deleted,
and the rendered `Next PDF page` control was activated with a real browser
mouse move/down/up sequence.

This differs from corrupt-PDF metadata failure: document inspection and page 1
both succeeded before page 2 failed to load.

## P1 product loss

Before the fix:

- page state changed `1 / 2 -> 2 / 2`;
- page 2 endpoint returned HTTP `422`;
- page image remained `155.5x43 @ (162.5,155)`;
- PDF error UI: absent;
- page frame: blank;
- relay pending requests: `0`.

The page control reported success while the selected page was an unexplained
blank surface.

`lynx-explorer-pdf-page-load-failure-blank`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

PDF page loading now uses a focused, URL-keyed `ExplorerPdfPageImage`:

- each page URL starts with clean render state;
- the real Lynx `binderror` handles HTTP/decode failure;
- the failed image unmounts;
- the existing `Could not render this PDF.` state replaces it.

Metadata, page navigation, successful page rendering, toolbar controls, and
server routes are unchanged.

## After evidence

The same trusted page transition after fixture deletion produced:

- page state: `2 / 2`;
- page 2 endpoint: HTTP `422`;
- page image: unmounted;
- page frame: `159.5x47 @ (160.5,153)`;
- error container: `137.828125x26 @ (171.328125,163.5)`;
- error copy: `Could not render this PDF.`;
- error bottom: `189.5`, fully inside the viewport;
- relay pending requests: `0`;
- transport/RPC errors: none.

A temporary after PNG was exactly `320x200`, SHA-256
`abf98eb840a553b6a88401ff8e73a461ab493751f5227d87691c20651baa4bcd`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Focused Lynx Rstest passed `2 files / 3 tests`, including a real
  `bindEvent:error` component transition.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4557.2 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `76b159d936357b01b65eb30096312ea08117e3fd85e5c05edf9df877b39cda83`.
- Lynx-for-Web bundle SHA-256:
  `bfb7fefa2c1adc4e22dc8b6f0b9dc99fce37b65ecfad10c0a875fa957bd48f1c`.
- Native cannot certify `320x200`; the build is supporting evidence only.
- The failed page transition used a real product control and browser pointer,
  not controlled DOM activation.
- The file deletion was exact-owned failure injection after page 1 success.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
