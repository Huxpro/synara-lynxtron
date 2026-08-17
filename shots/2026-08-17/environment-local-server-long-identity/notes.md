# Environment Long Local Server Identity at 320x200

## Newly discovered content-pressure state

Four real server rows included one page title:

`Extremely Long Local Development Server Title That Must Never Overlap the Stop Control or Address Geometry`

The other rows were Synara Vite and two short harness-owned Python servers.

## Geometry

Every row remained `274x42`.

For all four rows:

- identity copy region:
  `208px`, ending at `x=266`;
- Stop control:
  `24x24 @ x=274..298`;
- copy/Stop overlap: false;
- title and address remained one-line surfaces;
- row width stayed `274px`.

The long title stayed inside the same 208px identity allocation and did not
shrink, move, or cover the Stop hit area.

## Classification

- `environment-local-server-long-identity`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

## Harness

- viewport: `320x200`, DPR 1, dark;
- server ports:
  `8891`, `58181`, `58182`, `58183`;
- all Python servers were current-run owned;
- one initial attempt failed before trigger hydration and was cleaned before
  retry;
- all owned ports and browser processes were clear at exit;
- screenshot count remained `100`.
