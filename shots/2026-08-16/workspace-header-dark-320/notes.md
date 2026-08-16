# Workspace header dark at 320px

## Newly discovered scope

This loop extended the repaired Workspace header to a separate theme and
interaction cell:

- `320x650`, DPR `1`;
- dark theme;
- default Workspace 1;
- compact title and all three icon actions;
- real Settings action and dialog;
- Web authority and Lynx-for-Web on one isolated server/origin.

## Identity

The clients used:

- `ws://127.0.0.1:58090`;
- trusted `http://localhost:8891`;
- the same empty isolated snapshot;
- route `/workspace`;
- one real default workspace and terminal.

Lynx relay diagnostics reported connection attempts `1`, an open socket, zero
pending requests, and no transport/RPC error.

## Dark evidence

The Lynx root resolved `SliceRoot--theme-dark`.

- Workspace 1 title: `73.19x15`, `rgb(252,252,252)`;
- New terminal action: `28x24`, icon `12x12`;
- Workspace settings action: `28x24`, icon `12x12`;
- Delete workspace action: `28x24`, icon `12x12`;
- all SVG content used explicit `stroke="#fcfcfc"`;
- all three accessibility labels remained present.

A real Settings icon touch opened:

- dialog `296x329 @ (12,160.5)`;
- dark surface `rgb(23,23,23)`;
- foreground `rgb(252,252,252)`;
- fully contained inside the 320px viewport.

The first dark probe selected text helper nodes as action candidates and failed
before interaction when an icon lookup returned null. It was rejected as a
harness selector error; the exact class-token retry produced the retained
evidence.

## Classification

`lynx-workspace-header-dark-320`: missing coverage `1.00 -> 0.00`.

Product-loss contribution remained `0.00 -> 0.00`. The known Lynx Web
initialization deprecation was the only console warning and remains accepted
upstream noise.

## Cleanup

- Browser entry and exit cleanup passed.
- Every browser command ran through `browser:run`.
- Exit returned `sessions: []` and zero agent-browser-owned processes.
- No screenshot was retained; local count remained `100`.
- Owned server/Web processes and temporary state/stage were removed.
