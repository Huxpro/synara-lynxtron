# Composer project folder icon

Status: retained Web/Lynx-for-Web geometry and exact-owned Native paint proof.

## Residual

The landing project tray was already geometrically converged:

- Composer surface `736x95`;
- tray `736x58`;
- trigger `122.859375x28` in Browser;
- icon slot `14x14`;
- label and trigger spacing aligned.

The remaining difference was the icon source. Web uses the canonical Central
`folder-2.svg`, while Lynx used the generic Tabler `FolderIcon`. Both conveyed
"folder", but the outline anatomy was visibly different.

## Fix

The Lynx project-picker adapter now imports the exact shared
`@synara-central-icons/folder-2.svg?raw` asset and colorizes it through the
existing theme SVG pipeline.

The existing `ComposerProjectPickerTriggerIconLynx` class is now the explicit
14x14, non-shrinking size owner rather than relying on the removed generated
icon component's inline size.

## Browser evidence

At `1280x820`, DPR 1, light, comfortable:

- Web trigger `408,520.75,122.859375x28`;
- Lynx trigger `408,560,122.859375x28`;
- both icon boxes are 14x14, relative `7,7`;
- both use the canonical paths beginning `M9.13202 3.75` and
  `M2.75 12.75V11.75`.

The absolute Y difference comes from the real provider-status banner shown
after the Lynx bundle reload. Trigger-internal geometry is exact.

## Native evidence

- Production bundle:
  `fc01fccf84283b6586c2674e3d2a2d160a867d80e52ae7e14deb1741b8e4caca`.
- Snapshot online backup:
  `645147865293c4f0123aea74a5e0ca4f5d966c473174b5fa96ed3d4de23962a9`.
- Owned launch root/child: `83486 -> 83493`.
- PID-derived DevTool target: `localhost:8901/session 1`.
- Session URL points to the exact staged Synara bundle.
- Composer `400,461,736x95`.
- Tray `400,536,736x58`.
- Trigger `408,560,122x28` (whole-pixel Native rounding).
- Icon `415,568,14x14`; relative position remains within 1px of Browser.
- DOM contains both canonical folder-2 paths with light ink `#0d0d0d`.
- Warning/error console: empty.

The first focused test correctly failed because it looked for the size owner in
the general Composer stylesheet. The actual owner is
`landing-composer.css`; the test was corrected and the explicit flex-shrink
contract was added there.

Focused test passes 1/1. Lynx-for-Web and Native/Desktop production builds pass
with only existing warnings.
