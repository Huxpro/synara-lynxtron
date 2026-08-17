# Explorer Nested Search Identity at 1280x820

## Newly discovered scope

A canonical normal-size Explorer search selected the nested result
`src/deep/needle.ts` at `1280x820`, DPR 1, dark.

This verifies the auxiliary path identity that compact short-height Explorer
intentionally hides.

## P1 product loss

Web authority splits a result into filename plus directory prefix. Lynx
rendered filename plus the complete path:

- row: `231x28 @ (773,139)`;
- filename: `needle.ts`, `51.828125x16`;
- auxiliary path: `src/deep/needle.ts`, `89.5625x14`;
- combined copy: `needle.tssrc/deep/needle.ts`.

The filename was duplicated, wasting limited row width and weakening the
filename/directory hierarchy.

`lynx-explorer-nested-search-path-duplicates-name`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Explorer result rows now derive a normalized directory prefix:

- `src/deep/needle.ts -> src/deep/`;
- root-level files return no auxiliary path;
- Windows separators normalize to `/`;
- filename and directory retain independent one-line ellipsis.

## After evidence

- row remains `231x28 @ (773,139)`;
- filename remains `needle.ts`, `51.828125x16`;
- auxiliary path: `src/deep/`, `45.3125x14`;
- combined copy: `needle.tssrc/deep/`;
- no duplicate filename.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4562.2 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `ce54c8c52b32ae2d226b0a4a8da78a08f2da5f2db0121eb9677975e404c01762`.
- Lynx-for-Web bundle SHA-256:
  `926f4afd46b816f134bcf54042f6fe50685566020e7f9d8b41a0f52d36b5a013`.
- This is a normal-size identity cell, not a compact containment retest.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
