# Shared Landing and Thread header at 320px

## Newly discovered scope

The shared chat-surface header had only wide Landing typography evidence. This
loop added closed-sidebar Landing and ordinary Thread headers at `320x568`,
dark, plus an Editor embedded-header regression cell.

## P1 product loss

Landing was technically contained before the fix because its `New Chat` title
fit in the residual space at `x=234..289.06` after the 212px titlebar inset.
The ordinary Thread exposed the real loss:

- header remained `320x46` with `padding-left:212px`;
- `ThreadHeaderControls` occupied `x=212..300`;
- the thread title collapsed to `0px` width with an anomalous `378px` line box
  (`y=-166..212`);
- the title's nominal center hit Terminal instead of the title;
- the header did not report scroll overflow, so the identity was silently lost.

`lynx-thread-header-320-identity-collapse`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Landing and ordinary Thread frames now have explicit stable owner classes.
Only those two compact closed-sidebar headers use the two-row pattern:

- `ThreadsLandingHeader`
- `ThreadPageHeader`
- `height:92px`, `padding:46px 20px 0`.

Compact Thread identity is single-line ellipsis. The selector intentionally
does not target the Editor Chat rail frame.

## After evidence

Landing:

- header `320x92`;
- `New Chat` moved to `x=42..97.06`, `y=60..78`;
- title center `(70,69)` hit its own text.

Thread:

- header `320x92`;
- identity `x=20..140.55`, `y=60..78`;
- title `x=37.70..140.55`, `18px` high, single line;
- controls `x=140.55..300`, `y=55..83`;
- title center hit title text, controls remained reachable, no overflow.

At `800x568`, ordinary Thread retained a one-row `46px` header. Editor at
`320x568` retained its embedded Chat rail header at `46px`, proving the scoped
selector did not alter Editor composition.

Web output/stage SHA-256:
`121e1da1c90e2d46868da5543997ba4f631d3e3d17b4d1aceb92a4c8b83a125d`.

## Harness and verification classifications

- One patch context was stale and failed without modifying files. The failure
  boundary immediately reran browser cleanup and reconfirmed both zero values.
- A build/stage command ran from `apps/lynx`; its later root-only
  `browser:run` calls failed before opening a browser. Cleanup was rerun and the
  probes were restarted from repository root.
- The first generalized CSS selector would also have matched Editor rail
  headers. It was narrowed before retention; the Editor regression cell proves
  the final scope.
- Combined source tests passed `12/14`; the two failures are pre-existing
  source-contract drift unrelated to this CSS change:
  `ChatSurfaceHeaderIdentityElements` expects two usages but current router has
  three, and `EnvironmentPanel` expects a removed
  `presentationMode="editor"` literal. They are not reported as this slice's
  failures or silently fixed.

## Gates

- Focused desktop drag/header contract: `4/4`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- No screenshot retained; local count remained `100`.
- Every browser command used the guarded wrapper.
- Native compact interaction remains a certification boundary.
