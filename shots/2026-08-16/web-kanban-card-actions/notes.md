# Web authority compact Kanban card actions

## Authority preflight

- Renderer: current Web/Vite authority at `390x844`, DPR 1, dark.
- Server/snapshot: `.synara-fidelity-editor-changes` through
  `ws://127.0.0.1:58090`.
- A direct Effect-RPC shell snapshot contained four active projects and three
  threads at sequence 38.
- Cold Vite dependency optimization can leave the first frame empty for more
  than five seconds. In the diagnostic run:
  - 5 seconds: no rendered body/card state;
  - 30 seconds: the correct `Editor Changes`, `2 tasks`, and two Draft cards;
  - warm reload + 8 seconds: the same populated state.
- Therefore earlier empty Web authority frames were harness timing failures,
  not a persistent product hydration loss. The retained cell waits for the
  real `Actions for Editor changes review` control before classification.

## Product loss

- Once populated, the first card action measured
  `24.984375x16 @ (234.015625,109)`.
- A persistent provider-update toast occupied `x=16..374`, `y≈-8..118` at
  z-index 9999. Its content surface used `pointer-events:auto`, so the toast
  body—not the card action—was the top hit at the action center.
- Both trusted low-level pointer input and standard accessible click correctly
  refused to click through the toast. The card menu was inaccessible until the
  notification moved or was dismissed.
- Root cause was global toast pointer ownership, not Kanban z-index.

## Correction and runtime result

- Ordinary toast roots/content now use `pointer-events:none`.
- Copy, primary action, secondary action, and close controls explicitly retain
  `pointer-events:auto`. Archive-undo keeps its separate interactive surface.
- Post-fix hit testing proves both contracts simultaneously:
  - the card action is the top element at its center;
  - the visible `Review updates` toast action remains its own top hit.
- Standard accessible click on the real card action opens the Web context menu:
  - `180x217 @ (206,117)`, ending at `x=386`;
  - Rename task;
  - Pin thread;
  - Copy Path;
  - Copy Thread ID;
  - Archive task;
  - Delete.
- This settled Draft card has no unsent prompt, so Web correctly omits Start.
- Escape closes the menu, both action controls remain, and no thread mutation
  occurs.

## Classification

- `web-toast-background-pointer-shield`: P1 component contribution
  `1.00 -> 0.00`.
- `web-kanban-card-context-menu-compact`: new P2 Web authority interaction
  coverage, contribution `0.25 -> 0.00`.
- `web-cold-vite-populated-hydration`: harness timing loss, not product loss;
  fixed in the evidence protocol by waiting for the named product control.
- No weight, valid sample, or renderer scope was removed.
- Focused toast tests pass `6/6`, Web and root production builds pass, React
  diagnostics report zero errors/warnings, and page errors are empty.
- The retained PNG is exactly `390x844`; local screenshot count remains below
  100.
- Every browser action used `bun run browser:run -- ...`; final sessions,
  owned browser processes, and owned ports are zero.

## Evidence

- `00-before.json`
- `01-open.{png,json}`
- `02-closed.json`
- `threads-before.json`
- `threads-after.json`
- `errors.json`
- `console.json`
