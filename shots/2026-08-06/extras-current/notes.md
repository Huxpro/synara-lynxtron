# Composer Extras current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

## Harness

- Source base: `0ccc68b2`.
- Shared isolated state: `.synara-sxs`, server `58390`, trusted Web origin
  `http://localhost:9091`.
- Web original and Lynx-for-Web used the same snapshot, light theme,
  comfortable density, and `1280x820` DPR 1 viewport.
- The served `/lynx/main.web.bundle` hash matched the configured build.
- Both browser clients opened Extras through the rendered Composer extras
  trigger. No hidden state or direct component mutation was used.

## Current-head residuals

The old P10 atlas retained two real differences that the previous Extras
functional/state matrix did not block:

- Web trigger: `28x28`, radius `8px`; Lynx: `32x28`, radius `10px`.
- Web menu rows: radius `8px`; Lynx shared `.LxMenuItem`: radius `6px`.

The inherited `16px/normal` values on Lynx row containers are not the text
owner. The actual Extras label remains explicitly `12px`, so typography was
not patched.

## Repair

- The shared Lynx menu primitive now uses the canonical Web menu-row
  `8px` radius. This closes the root cause for Extras and every ordinary
  consumer of `MenuItem`, `MenuCheckboxItem`, `MenuRadioItem`, and
  `MenuSubTrigger`.
- Extras now has a named `28x28` trigger host and a separate `28x28`
  button chrome owner with `5px` padding and `8px` radius.
- Separating `ComposerExtrasTriggerHostLynx` from
  `ComposerExtrasTriggerLynx` prevents host padding from shifting the inner
  button and icon.

Final Lynx-for-Web geometry:

- trigger/button: `407/521/28/28`, radius `8px`;
- plus icon: `413/527/16/16`, centered by 6px on every side;
- first row: `130x26`, radius `8px`;
- Plan and Fast rows: radius `8px`;
- popup remains the previously calibrated `142x108` versus Web
  `141.421875x106`. The two-pixel engine/separator rhythm was already an
  explicit P9 disposition and was not hidden with a local height override.

Both final browser screenshots are exactly `1280x820`; both error logs are
empty.

## Native

- Configured bundle:
  `5e05f8af26d4f86fe013c4a7bb592187c9b6a12790fc4f2d45cb4feccfec90bf`.
- Exact-owned root PID `45645`, PID-derived
  `localhost:8903/session 1`.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- A real `Input.emulateTouchFromMouseEvent` press/release opened Extras from
  the rendered trigger.
- Native directly measures both host and inner button at `407/505/28/28`;
  the 16px plus icon is centered at `413/511`.
- Eight required roles, a `2560x1576` frame, and an empty warning/error
  console were retained.

This DevTool build reports `0px` radius for compound Native `VIEW` nodes, so
Native numeric radius is not claimed. Radius closure is supported by the
production source/test contract and current Lynx-for-Web computed styles;
Native certifies bundle/class identity, real interaction, geometry, screenshot,
and console.

## Verification

- Focused Menu/Extras suites: 2 files, 11/11 tests.
- Configured Lynx-for-Web production build: pass.
- Configured Native/Desktop production build: pass.
