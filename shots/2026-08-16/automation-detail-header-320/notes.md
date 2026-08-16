# Automation detail header hit ownership at 320px

## Newly discovered scope

Existing compact Automation evidence covered pane stacking and create-dialog
geometry. This loop added exact hit ownership for the populated detail
breadcrumb and actions header at `320x568`, with the fixed desktop titlebar
controls closed.

## P1 product loss

Before the fix:

- fixed titlebar controls occupied `x=90..174`, `y=0..46`;
- the breadcrumb occupied `x=20..300`, `y=12.5..32.5`;
- its center `(160, 23)` hit a titlebar navigation `IMG`, not the breadcrumb;
- a correct real pointer `move/down/up` at that center did not navigate;
- Edit/Delete/Resume were already safe at `y=208.5..236.5`.

`lynx-automation-detail-320-breadcrumb-titlebar-overlap`: P1 component
contribution `1.00 -> 0.00`.

## Root fix

Compact detail now uses the established two-row titlebar pattern:

- the detail header is `92px` high;
- the first `46px` remains owned by fixed desktop controls;
- breadcrumb content starts after `46px` via `padding: 46px 20px 0`;
- detail main height grows `200px -> 246px`, preserving the prior prompt body
  budget instead of stealing 46px from content.

Medium and wide detail geometry is unchanged.

## After evidence

At the same snapshot, route, dark theme, and `320x568` viewport:

- breadcrumb moved to `x=20..300`, `y=58.5..78.5`;
- center `(160, 69)` hit its own rendered text;
- titlebar controls remained `x=90..174`, `y=0..46`;
- actions remained contained and moved with the pane to `y=254.5..282.5`;
- viewport and visual viewport were exactly `320x568`, DPR 1;
- staged Web bundle matched build output SHA-256
  `c578b2bf7856a12a1f75e7c7ada0c3bb2ddd1edeff1085521ae4915226883831`.

No screenshot was retained; local count remained `100`.

## Harness classifications

These were rejected as product evidence:

- the first isolated server's long-lived Web Effect RPC transport entered a
  generic fiber-interrupted state; setup attempts were stopped and the owned
  server was reset rather than treating failures as product behavior;
- Web Add project is hover-revealed, so a static click was correctly rejected
  as covered until hover exposed the action;
- one injected diagnostic had a malformed `try/catch`; it failed before a
  mutation and was classified as a harness script error;
- `agent-browser mouse click` is not a supported command; the corrected raw
  pointer sequence is `mouse move/down/up`;
- Lynx-for-Web controls live under nested shadow roots. Geometry and deep
  `elementFromPoint` were valid, but agent-browser CSS selectors did not pierce
  those roots and raw pointer down/up did not synthesize Lynx `bindtap`.
  Therefore post-fix interaction remains a harness gap, not a claimed behavior
  pass.

## Browser leak gate

Every browser attempt, including all failures, ran through
`bun run browser:run -- ...`. Each attempt performed preflight and final
cleanup. The loop repeatedly verified `agent-browser session list --json`
returned `sessions: []` and the ownership-specific process scan returned zero.
Two unrelated Playwright Chrome trees were traced to active Vue-Lynx validation
jobs and intentionally not killed.

## Verification

- Focused Automations suite: `8/8`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- `git diff --check`: passed.
- Native compact interaction and exact-client console remain for the next
  Native batch; the production build is not reported as Native certification.
