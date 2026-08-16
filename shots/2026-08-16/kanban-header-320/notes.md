# Kanban route header at 320px

## Newly discovered scope

Existing compact Kanban evidence covered project-board action overflow at
`390px`, card actions, and dialogs. This loop added overview-header hit
ownership at `320x568`, dark, with the sidebar closed.

## P1 product loss

Before the fix:

- header: `320x46`;
- title `Kanban`: `x=20..69.70`, safe;
- count `0 tasks`: `x=81.70..122.47`;
- fixed desktop controls: `x=90..174`, `y=0..46`;
- count center `(102,23)` and most of its visible text hit titlebar icons;
- disabled New task remained safe at `x=207.78..300`.

`lynx-kanban-320-count-titlebar-overlap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Compact Kanban now uses a `92px` two-row header with
`padding: 46px 20px 0`, reserving row one for desktop controls. Medium Kanban
retains the prior `20px` compact-width inset and one-row header, preserving the
previously fixed action-overflow behavior.

## After evidence

At the same `320x568` state:

- header became `320x92`;
- title moved to `y=59..79`;
- count moved to `y=61..77`, and center `(102,69)` hit its own text;
- New task moved to `y=55..83`, remained contained at `x<=300`;
- fixed desktop controls remained in row one.

At `800x568` medium, the route header remained one row at `x=208..800`;
`Kanban`, `0 tasks`, and New task remained horizontally contained.

Web output/stage SHA-256:
`f5b70082f493c43a9d2faab6cb23e64f9a8cbf342b4c1870888f437c31a231dc`.

## Verification coverage correction

The preceding Pull Requests selector split invalidated an older Kanban source
contract that expected the two routes to share one combined selector. The PR
suites did not include this adapter test. This loop ran it, observed the
failure, and updated it to assert Kanban's own compact-two-row and medium-one-
row contracts. This was a verification coverage gap, not a product regression.

A command named two nonexistent Kanban test files; Rstest ignored them and ran
only the real header test. The result is reported accurately as header `1/1`,
not three suites. The actual existing Kanban mutation/dialog suites passed
`6/6`.

## Verification and cleanup

- Header contract: `1/1`.
- Existing Kanban mutation/dialog suites: `6/6`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- No screenshot retained; local count remained `100`.
- Every browser command used the guarded wrapper.
- Native compact behavior remains a certification boundary; builds are not
  reported as Native interaction evidence.
