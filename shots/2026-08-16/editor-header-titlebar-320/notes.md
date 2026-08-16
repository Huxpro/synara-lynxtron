# Editor header titlebar ownership at 320px

## Newly discovered scope

A global `AppWindowDragRegion` audit found two remaining headers without compact
titlebar inset rules. Settings owns only the open-state desktop controls and is
intentional. This cell verified the full-window Editor header at `320x568`,
dark, using a canonical project and thread.

## Result: intentional ownership and product pass

The Editor is a fixed full-window surface at `z-index: 90`; closed desktop
controls remain at `z-index: 80`. Editor therefore intentionally owns the
complete first 46px row rather than sharing it with the ordinary shell.

Measured geometry:

- Editor header: `x=0..320`, `y=0..46`;
- project title: `x=12..163.63`, one line;
- project samples at `x=22,62,91,101,120,160`, `y=23` all hit the project text;
- Switch project: `x=169.63..193.63`, center hit its icon;
- Hide chat: `x=199.63..262.81`, center hit its text;
- Chat: `x=268.81..308`, center hit its text.

The global closed-controls geometry remained `x=90..174`, `y=0..46`, but its
lower z-index did not steal hit ownership. No product loss was found and no
code change was made.

`lynx-editor-header-320-titlebar-ownership`: product pass, component
contribution `0.00 -> 0.00`.

## Harness and cleanup

- Fixture project/thread were created through canonical
  `orchestration.dispatchCommand`; SQLite was read-only evidence only.
- Every agent-browser command used the guarded wrapper.
- No screenshot was retained; local count remained `100`.
