# Editor Explorer Truncated Search at 320x200

## Newly discovered scope

The same canonical 100-file truncated search was opened in the Editor
Explorer, not the ordinary right dock:

- route flags:
  `editor=open&editorSearch=open&explorerQuery=match`;
- viewport: `320x200`, DPR 1;
- theme: dark;
- canonical result count: `80`;
- canonical `truncated:true`.

This is a distinct presentation boundary. Compact Editor uses a vertical
sidebar/preview stack inside the upper 76px Editor center.

## P1 product loss

The initial shared footer fix preserved the normal compact Editor's hard-coded
176px sidebar:

- Editor center/dock: `272x76 @ (48,46)`;
- sidebar: `272x176 @ (48,46)`, bottom `222`;
- entries: `272x108 @ (48,91)`, bottom `199`;
- footer: `272x22 @ (48,199)`, bottom `221`;
- preview: zero-height at `y=222`;
- Editor scroll height: `252`.

The truncation disclosure existed but was offscreen, and the Editor surface
overflowed its assigned grid row.

`lynx-editor-explorer-truncated-footer-offscreen`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Only short-height Editor Search now:

- lets the sidebar take the actual 76px center height;
- compresses search padding to 2px;
- uses the compact 14px truncation footer;
- removes truncated-list padding so one 28px result remains complete;
- hides the zero-space empty preview.

Normal-height Editor, ordinary Explorer, non-search Editor file mode, and data
contracts remain unchanged.

## After evidence

- Editor/root: `320x200`, no vertical overflow;
- dock: `272x76 @ (48,46)`, `scrollHeight=76`;
- sidebar: `272x76 @ (48,46)`;
- entries: `272x28 @ (48,79)`;
- first row: `272x28 @ (48,79)`, bottom `107`;
- footer: `272x14 @ (48,107)`, bottom `121`;
- footer copy: `Showing top matches. Refine search.`;
- preview: hidden;
- canonical result count/truncation remain `80 / true`.

A temporary after PNG was exactly `320x200`, SHA-256
`c030229444edb6b28f584674c815eac5c90e9d9841e4d56b466dcf629bb7cfd2`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4562.1 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `d2dda4bdd3ee498ce35b07431d3cab65f4ff4377a31de16943c797bd2e237b2f`.
- Lynx-for-Web bundle SHA-256:
  `04a5cb79a3c70230fb58910cc1daa5d790930674ed21eaffdbf5e9f9be0fd14f`.
- Native cannot certify `320x200`; the build is supporting evidence only.
- This cell reuses the canonical truncation signal but verifies a new Editor
  layout/presentation, not the ordinary dock again.
- Every browser workflow used `bun run browser:run -- ...` and returned to
  `sessions: []` with zero agent-browser-owned processes.
