# Native Explorer PDF page preview

Status: complete in-app Native page rendering with bounded navigation controls

## Implementation

- The server renders allowlisted workspace PDFs with `pdfjs-dist` and
  `@napi-rs/canvas`; it does not depend on system `pdftoppm`, `<webview>`, or a
  browser iframe.
- `projects.inspectPdf` returns the page count through the schema-backed RPC
  contract.
- `/api/local-pdf-page` returns a bounded PNG for one page and reuses the
  existing local-preview path/grant checks, authentication, trusted-origin
  CORS, and `nosniff` policy.
- Inputs are bounded to 32 MB, 500 pages, and a 320–1600 pixel render width.
  A 32-entry promise cache is keyed by real path, file size, mtime, page, and
  width.
- The Lynx Explorer renders the page through native `<image mode="aspectFit">`
  with Previous, page count, Next, and Open controls.
- Desktop deep-link startup now preserves the same controlled Explorer query
  fields as Lynx-for-Web. Existing second-instance navigation behavior remains
  route-only.

## Runtime evidence

- Source bundle SHA-256:
  `09a304e4eda71682ae732e5fa562b2eec34a435ea55915f30ba29cb19433d827`
- Isolated server: `ws://127.0.0.1:58920`
- Exact Native: PID `18102`, `localhost:8901/session 1`
- Unrelated `@t3tools/lynxtron` was not touched.
- Fixture: canonical 593-byte, one-page `report.pdf`, created in a real
  workspace and attached to a real project/thread through product RPCs.
- `projects.inspectPdf` returned `pageCount: 1`.
- The page URL is
  `http://127.0.0.1:58920/api/local-pdf-page?...&page=1&width=960`.
- The rendered PNG is `960x576`, has valid PNG magic, and has 1,201 non-white
  pixels in a normalized 300x180 sample.
- Native DOM exposes `report.pdf, page 1 of 1`; Previous and Next are both
  disabled for the one-page document.
- Native screenshot is `2560x1640`; warning/error DevTool console is empty.

## Verification

- Server PDF renderer and HTTP integration: 2 files / 11 tests.
- Lynx Explorer, URL, and desktop deep-link contracts: 3 files / 19 tests,
  plus the focused Explorer/URL tests rerun after final runtime fixes.
- Contracts: 2 files / 19 tests.
- Contracts, server, Web, and Native/Desktop production builds pass.
- React Doctor 0.9.11 changed-scope scan covers 12 Lynx files with zero
  diagnostics.
- Existing build warnings remain limited to unsupported Lynx CSS properties and
  optional `ws` native accelerators.

## Scope boundary

This closes in-app Native page rendering and page navigation controls. It does
not claim the Web viewer's selectable text layer, link annotations, search, or
zoom parity. Arbitrary Native text-range selection remains a host/engine gap.

## Cleanup

- The temporary project and thread were deleted through product RPCs.
- Exact-owned Native and server processes were stopped.
- Owned ports `58920`, `10053`, and `8901` were released.
- Temporary workspace, Native state, and isolated server state were removed.
- PID `36919` / `localhost:8902` belongs to the user's `t3code` Lynxtron
  instance and was not touched.
