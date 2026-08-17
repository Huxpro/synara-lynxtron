# Standalone Binary Changes at 320x200

## Newly discovered scope

A real binary working-tree modification was opened in standalone Changes at
`320x200`, DPR 1, dark:

- file: `data.bin`;
- canonical patch:
  `Binary files a/data.bin and b/data.bin differ`;
- patch length: `109` bytes;
- entry: real Environment `Changes` pointer click;
- expansion: real `data.bin` header pointer click.

## P1 shared product loss

Before the fix, the portable diff projection preserved only:

- `1 file`;
- `data.bin`;
- `+0/-0`.

Expanding the file produced no body, explanation, or binary identity. The DOM,
scroller text, and PNG were unchanged after the real expansion click.

The loss existed in the shared portable model and composition used by both Web
and Lynx, not in a Lynx-only style layer.

`shared-diff-binary-identity-missing`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

- `PullRequestDiffFileView` now carries an explicit `binary` flag.
- The canonical parsed path derives binary identity from the original unified
  patch.
- The pure-string portable fallback also recognizes
  `Binary files ... differ`.
- The shared `PullRequestCodeComposition` renders
  `Binary file changed.` inside the normal file disclosure.

Both renderers consume the same model and composition; no renderer-specific
binary special case was added.

## After evidence

With a fresh Lynx-for-Web artifact and real expansion:

- file card: `271x50 @ (25,142)`;
- binary notice:
  `269x16 @ (26,175)`, ending at `191`;
- scroller:
  `clientHeight=110`, `scrollHeight=126`;
- complete text:
  `1 file +0/-0 data.bin +0/-0 Binary file changed.`;
- pending requests: `0`;
- page errors: none;
- PNG: exactly `320x200`, then deleted.

## Validation

- Web parser Vitest: `4/4` passed.
- Lynx shared-composition Rstest: `1/1` passed.
- Web production build passed with `8953` modules.
- Lynx-for-Web production build passed:
  `4566.2 kB`.
- Web bundle SHA-256:
  `3b484f5a17381964f22eb3df88f5f775910a470d965e2a023371b0acfcd4ef94`.
- Native/Desktop production build passed:
  `4273.7 kB`.
- Staged Native bundle SHA-256:
  `3684f93a34601cd0d3d4af3a134e77d5193af83301971f5300eb9a2d265232e8`.
- Build output contained only registered chunk-size, CSS encode, and optional
  WebSocket native-extension warnings.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  free ports, removed isolated state/workspace/temp PNG, and repository
  screenshot count `100`.
