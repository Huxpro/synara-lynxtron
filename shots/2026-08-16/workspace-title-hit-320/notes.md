# Workspace title hit ownership at 320px

## Newly discovered interaction

This loop revisited the repaired 320px Workspace header along a different
boundary: pointer ownership across the visible title, not title width or action
geometry.

## Before evidence

At `320x650`, the visible Workspace title occupied:

- button `x=14..113.19`;
- text `x=27..100.19`.

Fixed closed-sidebar titlebar controls occupied `x=90..174`. Exact
shadow-root hit testing showed:

- title center hit Workspace raw text;
- title text right edge hit
  `DesktopTitlebarControlIcon--foreground`.

A center click still entered rename, so the title was not wholly unreachable.
Its visible right portion was a dead zone owned by unrelated window controls.

`lynx-workspace-320-title-hit-overlap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Compact Workspace now uses explicit rows:

1. a 46px title row inset to `x=180`, past the measured titlebar controls;
2. a 46px action row with the three accessible icon actions.

Medium/wide remains one 46px row. The implementation uses explicit flex
wrappers rather than `display: contents`, which is not reliable in Native Lynx.

## After evidence

At 320px after rebuilding:

- header `320x92`;
- title row `320x46`;
- title button `x=180..306`;
- title text `x=193..266.19`;
- button center, text center, and text right all hit Workspace raw text;
- a real center click entered rename;
- action row `320x46 @ y=46`;
- actions remained `28x24` at `x=206`, `242`, and `278`;
- terminal moved below the complete header to `y=92`, `320x558`;
- real Settings action opened the contained `296x329` dialog while terminal
  stayed mounted.

## Native regression caught before landing

The first two-row implementation used `display: contents` for the default
medium layout. Exact-owned Native exposed a real regression:

- action wrapper `y=-14`, height `72`;
- actions stacked vertically;
- first action ended at `y=10`;
- last action extended to `y=58`, outside the 46px header.

That implementation was rejected before commit.

The final implementation uses explicit flex wrappers. Exact-owned Native
`900x650` then rendered:

- header `644x46`;
- title row `100x32 @ y=7`;
- horizontal action row `281x24 @ y=11`;
- all three action nodes and labels present;
- no overlap or vertical overflow;
- empty warning/error console.

Native identity:

- PID `78990`;
- PID-derived `localhost:8902/session 1`;
- exact staged bundle.

The final per-action report loop split labels containing spaces and failed
after the wrapper/title geometry had been recorded. This was a reporting-script
error, not a product failure; DOM identity already proved all three labeled
action nodes.

## Verification and cleanup

- Focused Workspace suite: `5/5`.
- Expanded Workspace/layout/shell suites: `25/25`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- Final output/staged bundle SHA-256:
  `cd08ea00106775c117e2e5b177472a160083504be96feae9cc3bd59f050c2581`.
- Browser entry/exit cleanup passed.
- Exit returned `sessions: []` and zero agent-browser-owned processes.
- No screenshot was retained; local count remained `100`.
- Owned server/Web/Native processes and temporary state/stage were removed.
