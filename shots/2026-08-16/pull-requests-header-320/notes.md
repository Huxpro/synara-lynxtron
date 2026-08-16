# Pull Requests route header at 320px

## Newly discovered scope

This loop added the Pull Requests list route header at `320x568`, dark, with
the global sidebar closed. Existing minimum-window evidence covered populated
detail layout and close behavior, not list-header hit ownership against fixed
desktop controls.

## P1 product loss

Before the fix:

- route header: `320x46`;
- `Pull requests`: `x=20..105.75`, `y=13..33`;
- fixed desktop controls: `x=90..174`, `y=0..46`;
- title center `(63,23)` was safe, but visible samples `(91,23)`, `(101,23)`,
  `(120,23)`, and `(150,23)` hit the sidebar toggle or titlebar icons;
- Refresh was safe at `x=272..300`.

The compact override incorrectly reset the closed-sidebar PR header from the
ordinary `212px` titlebar inset to `20px`.

`lynx-pull-requests-320-titlebar-overlap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Compact Pull Requests now uses a two-row `92px` header with
`padding: 46px 20px 0`, reserving row one for desktop controls and keeping the
shared title/scope/Refresh composition together in row two.

The previous combined Kanban/PR compact-medium selector was split. Kanban keeps
its existing compact/medium behavior. PR medium no longer receives the unsafe
20px closed-sidebar override and retains the normal single-row shell geometry.

## After evidence

At the same route/state/theme and `320x568`, DPR 1:

- header became `320x92`;
- title moved to `x=20..105.75`, `y=59..79`, center `(63,69)`;
- Refresh moved to `x=272..300`, `y=55..83`, center `(286,69)`;
- title and Refresh centers hit their own rendered content;
- fixed controls remained entirely in row one, `y=0..46`.

At `800x568` medium, the sidebar was open and the route header remained one row
at `x=208..800`, `y=0..46`; title started at `x=228` and Refresh ended at
`x=780`.

Staged Web bundle matched build output SHA-256
`fe8231d29424e64825f788ab8b3ede684a0723c39c0daff88c7f184bc5579701`.

## Harness classifications

- A first static command used an unmatched zsh glob. It opened no browser, but
  the new failure-boundary protocol still reran cleanup and reconfirmed both
  zero conditions before continuing.
- Raw pointer `move/down/up` on Refresh did not publish a Lynx-for-Web
  `bindtap`, and this stage did not expose RPC tag counts. Refresh interaction
  remains a route-specific harness gap; it is not claimed as a behavior pass.
- No screenshot was retained; local count remained `100`.

## Verification

- Focused responsive suite: `4/4`.
- Expanded Pull Requests suites: `11/11`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- Native compact interaction and exact-client console remain a certification
  boundary; the build is not reported as Native behavior evidence.
- Every browser command used `bun run browser:run -- ...`.
