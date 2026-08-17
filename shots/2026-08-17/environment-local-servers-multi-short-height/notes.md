# Environment Multi-Server Menu at 320x200

## Newly discovered scope

The prior Local Servers coverage contained one naturally occurring server.
This loop added three owned, real dev-server processes:

- Synara Vite: `localhost:8891`;
- `Alpha Dev Server`: `localhost:58121`;
- `Beta Dev Server`: `localhost:58122`;
- `Gamma Dev Server`: `localhost:58123`.

The Python HTTP processes were started and stopped by the current harness only.
No unrelated local server was terminated.

## Boundary discovery

Three servers fit exactly:

- popup: `288x167 @ (27,33)`, ending at `200`;
- list: `274x130`, all three 42px rows in bounds.

Four servers exposed the real P1:

- popup: `288x211 @ (27,0)`, ending at `211`;
- list: `174/174`, `overflow-y: visible`;
- fourth row ended at `204`;
- no scroll owner existed.

`lynx-environment-local-servers-multi-overflow`: P1 contribution
`1.00 -> 0.00`.

## Root fix

The short-height Local Servers popup now reuses the established Environment
branch-popup allocation:

- popup height/max-height: `calc(100vh - 16px)`;
- server list: `flex: 1`, `min-height: 0`, `overflow-y: scroll`.

Normal-height behavior is unchanged.

## Final evidence

- server instance:
  `0dfcaac7-a646-4975-bc31-81a979d3cf87`;
- pre-fixture Web/Lynx/Native snapshot sequence: `0`;
- post-fixture sequence: `2`;
- scanner result: exactly four real servers;
- header: `4 servers running`;
- popup:
  `288x184 @ (27,16)`, ending at `200`;
- list:
  `274x147 @ (34,46)`;
- list `clientHeight=147`, `scrollHeight=174`;
- list `overflow-y: scroll`;
- root `clientWidth=scrollWidth=320`;
- pending requests: `0`;
- page errors: none;
- PNG: exactly `320x200`, then deleted.

Programmatic max-scroll was used only to prove reachability:

- `scrollTop=27`;
- fourth row moved to `y=151..193`.

This is setup/anatomy evidence, not wheel or Native gesture evidence.

## Harness classification

- The first interaction attempt did not position the offscreen trigger and did
  not mount the popup. It was rejected as harness setup failure.
- Each retained scanner result independently verified the owned ports.
- All three owned Python processes, the isolated Synara server, browser
  session, state, and ports were removed at exit.
- Browser entry/failure/exit gates returned `sessions: []` with zero
  agent-browser-owned processes.

## Validation

- Focused Environment Rstest: `8/8` passed.
- Web production build passed with `8953` transformed modules.
- Web main SHA-256:
  `844311714c248e66218f5bf6ea2543471054602a265bfeeb5ebac62055348817`.
- Lynx-for-Web production build:
  `4591.7 kB`,
  SHA-256
  `e846ef3b152d54e6ca2a4d6d5a81e124220b28d845a25486eb33b5d2d8941b86`.
- Native/Desktop production build:
  `4296.4 kB`,
  SHA-256
  `61c7e149d1cc63f565dfa270da1df86b4522b426d09ce9348f72297d8a289e30`.
- Screenshot count remained `100`.
