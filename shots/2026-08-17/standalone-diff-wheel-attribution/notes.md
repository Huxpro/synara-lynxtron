# Standalone Changes Wheel Attribution

## Scope

A canonical two-file standalone Changes patch was expanded at `320x200`,
DPR 1, dark. The first file contained 30 replacement lines, placing the
second file far below the visible scroller.

The interaction path used real browser input:

- click Environment `Changes`;
- click the first file header;
- place the mouse over the rendered Changes scroller;
- issue `agent-browser mouse wheel 220`.

## Measured result

Before wheel:

- scroller `clientHeight=110`;
- scroller `scrollHeight=796`;
- scroller `scrollTop=0`;
- first file header `y=143..175`;
- second file header `y=829..861`;
- root `scrollWidth=320`.

After real wheel:

- scroller `scrollTop=0`;
- first file header remained `y=143..175`;
- second file header remained `y=829..861`;
- root remained `scrollWidth=320`.

Lynx-for-Web therefore did not translate this real wheel input into vertical
movement of the custom `scroll-view`.

## Classification

- This is not promoted to a Native product loss.
- The repository verification contract explicitly requires Native
  certification for real wheel/gesture behavior and Native `<list>` /
  `scroll-view` semantics.
- The Web custom element declares vertical scroll support through
  `@lynx-js/web-elements`, so the result is retained as Lynx-for-Web
  interaction/harness divergence pending exact-owned Native verification.
- `standalone-diff-native-wheel`: missing coverage remains `1.00`.
- Product-loss contribution remains unscored; no product code was changed.

## Cleanup

- An attempted follow-up gutter-target script had already been deleted by the
  prior cleanup and executed no browser workflow. The explicit cleanup gate
  still ran immediately afterward.
- Every real browser workflow used `bun run browser:run -- ...`.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  free ports `58090` and `8891`, and removed state/workspace/temp PNGs.
