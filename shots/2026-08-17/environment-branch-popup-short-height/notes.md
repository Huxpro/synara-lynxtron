# Environment Branch Popup at 320x200

## Newly closed interaction gap

A canonical repository with `main` plus 12 local feature branches backed a
real thread. The rendered Environment branch trigger measured
`274x26 @ (27,151)` and received a real mouse click.

No branch option was selected, so this loop had no Git mutation.

## P1 product loss

Before:

- popup: `224x320 @ (27,0)`, ending at `320`;
- list: `214x310 @ (32,5)`;
- list: `clientHeight=310`, `scrollHeight=364`.

The branch picker extended `120px` below the short viewport.

`lynx-environment-branch-short-overflow`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

At short height only:

- popup height/max-height:
  `calc(100vh - 16px)`;
- branch list flexes into the popup;
- branch list owns vertical scrolling.

## After evidence

- popup: `224x184 @ (27,16)`, ending at `200`;
- popup client height: `182`;
- list: `214x174 @ (32,21)`, ending at `195`;
- list: `clientHeight=174`, `scrollHeight=364`;
- scroll range: `190px`.

## Validation

- Environment Rstest: `8/8` passed.
- Lynx-for-Web production build passed: `4581.8 kB`.
- Web bundle SHA-256:
  `cb4b357ac3105ba233276d38db6baf28b648b8cfb3fac785f927de08fd800ea7`.
- Native/Desktop production build passed: `4287.2 kB`.
- Staged Native bundle SHA-256:
  `4559e434805f1ff6b6be82be3163f1948d538f663c653df5c77272b95f5dc9b6`.
- Two fixture attempts reused stale command IDs and were rejected before popup
  interaction. Each was followed by the double-zero browser gate.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  removed state/workspaces, and repository screenshot count `100`.
