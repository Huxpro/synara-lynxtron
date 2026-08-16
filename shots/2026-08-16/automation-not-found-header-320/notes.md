# Automation not-found header at 320px

## Newly discovered scope

This loop added the missing Automation detail state at `320x568`. It is a
separate surface from the populated detail because it owns
`AutomationDetailNotFoundHeader` rather than the populated breadcrumb header.
No fixture or SQLite write was needed.

## P1 product loss

Before the fix:

- the not-found header was `320x46`;
- `Automations` occupied `x=20..103.36`, `y=12.5..32.5`;
- fixed desktop controls occupied `x=90..174`, `y=0..46`;
- title center `(62,23)` remained visible, but the visible right segment was
  covered: `(91,23)` hit the sidebar toggle and `(101,23)` hit its icon;
- the body Back to automations action was safe at `y=307.5..335.5`.

`lynx-automation-not-found-320-title-overlap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Compact not-found detail now follows the established two-row titlebar pattern:
its header is `92px` high and uses `padding: 46px 20px 0`, reserving the first
row for desktop controls and rendering the title in the second. Medium and wide
retain the original `46px` header.

## After evidence

At the same empty snapshot, route, dark theme, and `320x568` viewport:

- title moved to `x=20..103.36`, `y=58.5..78.5`;
- center `(62,69)` hit the title;
- corrected edge probes `(22,69)`, `(91,69)`, and `(101,69)` all hit the title;
- `(105,69)` hit the containing header, not a fixed control;
- Back to automations remained safe at `y=330.5..358.5`;
- staged Web bundle matched build output SHA-256
  `cb5e993d0b0b98b71d3553cfdae399b84b07b14b39447236519a05f24d1f5fbd`.

The first after edge helper accidentally retained the before `y=23` probes and
therefore measured the intentionally reserved titlebar row. It was rejected as
a harness script error and rerun at the title's measured `y=69`.

## Verification and cleanup

- Focused Automations suite: `9/9`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- `git diff --check`: passed.
- Every browser command used `bun run browser:run -- ...`; failures and success
  paths both performed final cleanup.
- No screenshot was retained; local count remained `100`.
- Native compact behavior remains for the next batch certification; builds are
  not reported as Native interaction evidence.
