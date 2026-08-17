# Native Automations Create Policy Reachability

## Newly Discovered P1

At the Native minimum `900x650` window, New automation rendered its lower
policy controls outside the actual dialog-panel viewport:

- dialog: `420x618 @ (240,16)`;
- panel: `386x420 @ (257,74)`;
- footer: `386x32 @ (257,508)`;
- `25 runs`: `y=522..548`, hit resolved to the footer;
- `Stop on error / Off`: `y=568..594`, hit resolved to the popup;
- `Interaction mode / Plan`: `y=614..640`, hit resolved to the popup.

Real Native drag plus positive and negative wheel input left the first target
at `y=522`. Real touches on all three visible DOM boxes did not change
selection or summary state.

`native-automations-create-policy-controls-unreachable`: P1 product
contribution `1.00 -> 0.00`.

## Root Cause

Three boundaries combined:

1. `width: min(560px, calc(100vw - 32px))` was not retained by the Native CSS
   encoder, so the popup inherited the base `420px` width.
2. Shared `.LxDialogPanel { max-height: 420px }` overrode the automation
   panel's flex height.
3. The complete policy form remained a single vertical stack.

Adding only `scroll-orientation`, adding a direct scroll child, and real
drag/wheel attempts were all ineffective in this Lynxtron host and were
reverted rather than retained as speculative fixes.

## Fix

- Use a Native-encodable explicit `560px` dialog width with
  `max-width: calc(100vw - 32px)`.
- Give the Automation create panel an explicit `520px` max height with a
  selector specific enough to override the shared dialog cap.
- Group Repeats through Permissions in a two-column options grid at medium and
  wide widths.
- Keep compact widths single-column.
- Hide the redundant description and tighten footer spacing at medium width so
  the product hierarchy fits without depending on broken host scrolling.

## Exact-Owned Native Result

Final bundle SHA-256:

`15bf4fba5d45227871e561cc8452d45bf0a0a3bb932a6b43f96b949b65aed145`

Final isolated Native instance used server `58092` and a PID-derived DevTool
client, separate from the user preview server on `58090`.

Resolved geometry:

- dialog: `560x618 @ (170,16)`;
- panel: `526x520`;
- `25 runs`: `61x26 @ (331,435)`, touch `(361.5,448)`;
- `Stop on error / Off`: `36x26 @ (499,435)`, touch `(517,448)`;
- `Interaction mode / Plan`: `43x26 @ (252,497)`, touch `(273.5,510)`.

After real touches:

- all three controls carried `AutomationCreateChoice--selected`;
- summary contained `25 runs`;
- summary contained `Continues after errors`;
- summary contained `Plan mode`;
- real Cancel closed the dialog;
- no `automation.create` request was emitted;
- Native warning/error console was empty;
- temporary screenshot was `1800x1300` and deleted.

## Verification

- Focused Automations Rstest: `1 file / 11 tests`.
- Native/Desktop production build passed.
- Existing unsupported Lynx CSS and optional `bufferutil` /
  `utf-8-validate` warnings were unchanged.

## Harness Losses And Cleanup

- Several early attempts clicked offscreen DOM geometry and were rejected.
- A first isolated setup accidentally targeted the user preview server's
  hard-coded `58090` endpoint; its command collision was rejected before Native
  product evidence and the setup was corrected to `58092`.
- An all-choice DOM diagnostic reset DevTool with `ECONNRESET`; lower-load
  geometry probes replaced it.
- The user preview server was never stopped or reused for retained evidence.
- Every failure boundary ran `browser:gate`.
- Final owned server/app/state/log/image resources were removed.
- Screenshot count remained exactly `100`.
