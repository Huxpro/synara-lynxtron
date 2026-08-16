# Automation detail headers at medium width with sidebar closed

## Newly discovered scope

This loop added both populated and not-found Automation detail headers at
`800x568`, dark, medium, sidebar closed. The earlier medium list-header pass
did not cover these independent header owners.

## P1 losses

Not-found before:

- title `Automations`: `x=20..103.36`, `y=12.5..32.5`;
- fixed controls: `x=90..174`, `y=0..46`.

Populated before:

- left header: `x=0..480`, `46px`;
- breadcrumb: `x=20..460`, `y=12.5..32.5`;
- right actions header: `x=480..800`, safe;
- fixed controls covered the breadcrumb's left/middle portion.

Loss accounting:

- `lynx-automation-not-found-medium-closed-title-overlap`: P1 `1.00 -> 0.00`;
- `lynx-automation-detail-medium-closed-breadcrumb-overlap`: P1 `1.00 -> 0.00`.

## Root fix

Medium sidebar-closed detail and not-found headers retain the existing 46px
single-row layout but receive `padding-left:180px`. This avoids unnecessary
height growth at 800px, preserves the populated two-column detail, and leaves
the right actions header unchanged.

## After evidence

Not-found:

- title moved to `x=180..263.36` in the same 46px row.

Populated:

- breadcrumb moved to `x=180..460`, same 46px row;
- actions header remained `x=480..800`, `46px`.

Medium sidebar-open remained unchanged; populated breadcrumb measured
`x=228..460`.

Web output/stage SHA-256:
`cd3a164f4c2cef288b8acf0b047b6de5040c2837d5169cb61fcd619251000b2d`.

## Verification

- Focused Automations suite: `10/10`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- Fixture project/automation were created and will be removed through canonical
  RPC; SQLite was never written directly.
- DOM click established sidebar-closed state only; no toggle interaction pass
  is claimed.
- No screenshot retained; local count remained `100`.
