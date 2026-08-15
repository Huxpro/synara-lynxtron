# Narrow compact Kanban card actions

- Newly exercised viewport: populated project board × `320x568` × DPR 1 ×
  dark × complete card actions × Rename editor.
- Snapshot: `.synara-fidelity-editor-changes`; no fixture or direct database
  mutation was used.

## Initial result

- Header: `320x46 @ (0,0)`.
- First card: `248x64.5 @ (20,94)`.
- The eight-action chooser wrapped cleanly into four rows:
  - panel: `288x208 @ (16,56)`, ending at `x=304`;
  - every action remained inside the viewport;
  - cards shifted below the in-flow chooser without horizontal overflow.
- Opening Rename exposed a real P2 layout loss:
  - panel: `288x168 @ (16,56)`;
  - shadow textarea: `284x58 @ (29,115)`, ending at `x=313`;
  - the textarea exceeded the panel's outer right edge by `9px`.
- Relative to the panel's padded content edge (`x=292`), the input exceeded
  its intended box by `21px`.

## Root cause and correction

- `KanbanMutationTextarea` used `width:100%` while its Lynx-for-Web shadow
  textarea also carried `10px` horizontal padding and `1px` borders.
- Applying `box-sizing:border-box` to the custom element did not propagate into
  the shadow textarea and was rejected after runtime measurement.
- The retained fix compensates the shadow control's exact box model with
  `width:calc(100% - 22px)`.
- Post-fix production bundle
  `6beb76ad820405ffac5d98fa9e05bff9c3ef55e53a76b4e04ead891a6de9dce0`
  measures:
  - panel content edge: `x=292`;
  - textarea: `262x60 @ (29,115)`, ending at `x=291`;
  - padded-content overflow: `21px -> 0px`;
  - outer-panel overflow: `9px -> 0px`.
- Trusted pointer and keyboard input still updated both the shadow textarea and
  custom-element host to `Editor changes review probe`. Cancel closed the
  panel, kept both cards, issued no dispatch, and preserved the thread
  projection exactly.

## Classification

- `lynx-kanban-mutation-textarea-content-overflow`: P2 component contribution
  `1.00 -> 0.00`.
- `lynx-kanban-actions-320-compact`: new P2 viewport/interaction coverage,
  contribution `0.25 -> 0.00`.
- No score weight, valid sample, or viewport scope was removed.
- Page errors are empty; console output contains only the known upstream Web
  Core deprecated-initialization warning.
- Focused tests pass `10/10`, the dedicated regression passes `1/1`, root
  production build passes `6/6`, explicit Lynx-for-Web build passes, and React
  diagnostics report zero warnings/errors.
- Native narrow-window/input behavior remains missing certification coverage.
  The official published `0.0.9` host still renders without registering a
  DevTool client, so no Native claim is inferred.
- Every browser attempt used `bun run browser:run -- ...`; final sessions,
  owned browser processes, and owned ports are zero.

## Evidence

- `00-before.json`
- `01-open.json`
- `02-rename.json`
- `after/00-rename.json`
- `after/01-edited.json`
- `after/02-cancelled.json`
- before/after `threads-*.json`
- before/after `errors.json`
- before/after `console.json`
- before/after `bundle.sha256`
