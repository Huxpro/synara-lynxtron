# Workspace header at 320px

## Newly discovered scope

This loop added a narrower Workspace header state than the earlier `390x844`
compact matrix:

- `320x650`, DPR `1`;
- light theme;
- default Workspace 1;
- Web authority and Lynx-for-Web on one isolated server/origin;
- header title and all primary actions;
- real compact Settings action;
- exact-owned Native `900x650` regression boundary.

The previously covered `900x650` asymmetric terminal presets were not counted
again.

## Comparable identity

Both browser clients used:

- server `ws://127.0.0.1:58090`;
- trusted origin `http://localhost:8891`;
- the same isolated empty server snapshot;
- route `/workspace`;
- one real default workspace and host-backed terminal.

Relay diagnostics reported one active connection, zero pending requests, and
no transport/RPC errors. Browser page errors were empty.

## P1 product loss

Web authority at `320px` keeps a compact header:

- full Workspace 1 title text: `83.73x20`;
- Terminal icon action: `28x28`;
- Settings icon action: `28x28`.

Before the fix, Lynx kept three text actions in the same 320px header:

- Terminal `48.08x24`;
- Settings `47.28x24`;
- Delete workspace `82.86x24`.

The title button was compressed so its visible text box shrank from the normal
`73.19px` to `55.78px`, clipping even the default `Workspace 1` title. The
actions technically fit, but only by sacrificing the route identity.

`lynx-workspace-320-header-title-clip`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

All three Lynx actions now own:

- a stable icon;
- a real `LxButton__text` label for medium/wide layouts;
- an explicit accessibility label.

At compact width, CSS keeps each action at `28px` and hides only its visual
text. Delete remains available in the header instead of being removed from the
Native product.

The title now owns `min-width: 0`, shrink behavior, and ellipsis semantics
rather than relying on uncontrolled flex compression.

## After evidence

At `320x650` after rebuilding:

- Workspace 1 text returned to `73.19x15`;
- title button returned to `99.19x32`;
- New terminal, Workspace settings, and Delete workspace each measured
  `28x24`;
- all three icons measured `12x12`;
- hidden visual labels had zero layout boxes;
- accessibility labels remained complete.

A real Settings icon touch opened the fully contained `296x329` settings dialog
while the `320x604` terminal grid stayed mounted.

## Native regression boundary

Exact-owned Native used:

- PID `76335`;
- PID-derived `localhost:8902/session 1`;
- exact staged production bundle;
- `900x650`, medium viewport.

Medium layout correctly retained visible text:

- title `100x32`;
- New terminal `73x24`;
- Settings `73x24`;
- Delete workspace `119x24`;
- no overlap, with substantial spacer width;
- all three actions had real icons and accessibility labels;
- warning/error console was empty.

The 320px product loss is certified by Lynx-for-Web because Native enforces a
900px minimum. The Native run verifies the compact rule does not regress the
supported medium window.

## Harness classifications

Attempts to create a long-title fixture through rendered rename controls were
rejected as harness input failures:

- the first Web double-click path did not enter rename;
- a hard-coded Lynx ref was used before snapshot generation;
- a later Lynx textbox fill did not drive the custom-element input event.

Those attempts did not establish a comparable title and are not scored as
product evidence. The retained loss uses the default title and needs no
fixture mutation.

## Verification and cleanup

- Focused Workspace suite: `1` file / `5` tests.
- Expanded Workspace/layout/shell suites: `3` files / `25` tests.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Output/staged Native bundle SHA-256:
  `666f57f34f77dc0ee9e11bd0fa28ca75ff5373b81a5195a8de2497e493c318e4`.
- Browser entry/exit cleanup passed.
- Exit returned `sessions: []` and zero agent-browser-owned processes.
- No screenshot was retained; local count remained `100`.
- Owned server/Web/Native processes and temporary state/stage were removed.
