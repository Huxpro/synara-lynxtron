# Kanban medium closed-sidebar header

## Newly discovered scope

The prior Kanban compact fix verified `320px` closed and `800px` open states.
This loop added the missing combination: `800x568`, dark, medium viewport with
the sidebar closed.

## P1 product loss

Before the fix:

- sidebar-open medium was safe and one row at `x=208..800`;
- after closing the sidebar, the route header became `x=0..800`, `46px` high;
- medium's `20px` closed-sidebar override placed `0 tasks` at
  `x=81.70..122.47`;
- fixed controls remained `x=90..174`, `y=0..46`;
- count center `(102,23)` hit a titlebar icon instead of count text.

`lynx-kanban-medium-closed-count-overlap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Kanban now uses the two-row `92px` header for both compact and medium **only
when the sidebar is closed**. Medium sidebar-open does not match the rule and
retains its one-row header.

## After evidence

At the same medium closed state:

- header: `800x92`;
- title: `x=20..69.70`, `y=59..79`;
- count: `x=81.70..122.47`, `y=61..77`, center hit its own text;
- New task: `x=687.78..780`, `y=55..83`;
- fixed controls stayed in row one.

A fresh medium sidebar-open run retained `592x46 @ (208,0)`.

The rendered open-state toggle's exact center was measured, but raw
agent-browser pointer publication terminated before state observation. A DOM
click was used only to establish the closed product state; it is not claimed as
interaction evidence. This remains a route-specific interaction harness gap.

Web output/stage SHA-256:
`6d11e3fbd9108d26f6e71e34cb5e6fbaeda2eee0aff7bf97f4da1937245bee86`.

## Verification

- Kanban header contract: `1/1`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- No screenshot retained; local count remained `100`.
- Every browser command used the guarded wrapper.
