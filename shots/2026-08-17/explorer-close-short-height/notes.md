# Explorer Close at 320x200

## Newly discovered scope

A canonical repository-backed Thread opened a selected source file in the
ordinary compact Explorer, then closed the dock at `320x200`, dark.

This checks the interaction after-state: dock teardown, active affordance, stale
width/padding, and composer restoration.

## Before

- Thread: `320x200`, `padding-right:0`;
- dock: `320x108 @ (0,92)`;
- close control: `28x28 @ (280,91.5)`;
- Files toggle class included `ThreadFilesToggle--active`;
- composer input: `296x62 @ (12,115)`.

## Transition and after

A controlled shadow-DOM activation called the rendered Close control's product
handler. This is not claimed as trusted pointer evidence.

After:

- dock: unmounted;
- Close control: unmounted;
- Files toggle active class: removed;
- Thread: still `320x200`, `padding-right:0`;
- composer input: unchanged at `296x62 @ (12,115)`;
- relay: one connection, zero pending requests, no transport/RPC error.

This is a compact close-transition product pass, contribution `0.00 -> 0.00`.
No code change was required.

## Boundaries

- The selected-file source path, file RPC, and syntax highlighting were real.
- Lynx-for-Web selector APIs do not cross the Lynx shadow root, so this cell
  records handler/state evidence rather than pointer evidence.
- Every browser workflow used `bun run browser:run -- ...` and ended with zero
  sessions/processes.
