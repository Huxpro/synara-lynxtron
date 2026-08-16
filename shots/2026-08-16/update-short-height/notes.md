# Update actions at 320x200

## Discovery matrix

A production scanner checked interactive bounds for `/kanban`,
`/pull-requests`, `/plugins`, `/automations`, `/automations/missing`, and
`/update` at `320x200`.

- Kanban and Automation not-found had no offscreen controls.
- PR filters/empty state and Automation empty state were below the fold inside
  real vertical scroll-view owners.
- Plugin's provider strip extended horizontally by design; reachability remains
  under the known custom-scroll interaction boundary.
- Update's two primary operations were offscreen without a real scroll-view.

## P1 product loss

Before:

- Check for updates: `178x32 @ (71,192)`;
- Open download page: `178x32 @ (71,233)`;
- UpdatePage: `clientHeight=200`, `scrollHeight=300`, but plain view rather than
  a vertical scroll-view.

Both primary actions were unreachable in the short viewport.

`lynx-update-short-actions-unreachable`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Short-height Update prioritizes status and actions:

- top-align page with 8px inset;
- use a full-width card with 12px padding;
- hide decorative mark, eyebrow, description, and version detail;
- reduce title/status/action spacing;
- preserve both full-width actions.

Normal-height layout remains unchanged.

## After evidence

At `320x200`:

- card: `304x151 @ (8,8)`;
- Check for updates: `278x32 @ (21,76)`;
- Open download page: `278x32 @ (21,114)`;
- both actions end at `y=146`.

At `320x568`, normal card retained the mark, description, original spacing,
and actions at `y=376/417`.

Web output/stage SHA-256:
`2dbbacc557364f7c475d1b2d6facf502fc974a5d693a17f1044e9e8fbe699ca7`.

## Verification

- Focused Update suite: `5/5`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- No screenshot retained; local count remained `100`.
- Every browser command used the guarded wrapper.
