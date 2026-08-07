# Sidebar Pull requests icon

Status: retained Web/Lynx-for-Web path/geometry and exact-owned Native paint
evidence.

## Residual

The shared Sidebar composition accepts the Web Pull requests icon as a host
parameter. Web passes `IoIosGitCompare`, but the Lynx host mapped that slot to
`MessageCircleIcon`. This was not an engine approximation: it changed the
semantic glyph from a compare/branch graph to a chat bubble.

## Fix

`PullRequestCompareIcon.lynx.tsx` reproduces the exact locally installed
`react-icons/io` 5.6.0 `IoIosGitCompare` source:

- viewBox `0 0 512 512`;
- filled path beginning `M233.9 328.1`;
- active theme ink through the existing Lynx SVG color pipeline.

The component is a narrow host adapter and carries a stable
`PullRequestCompareIcon` class for fail-closed evidence targeting. The shared
Web composition is unchanged. `Sidebar.lynx.tsx` now passes this component
instead of `MessageCircleIcon`.

## Browser evidence

At `1280x820`, DPR 1, light, comfortable:

- Web row `6,181.25,244x28`;
- Lynx row `6,179.25,244x28`;
- both icons `15x15`, relative `8.5,6.5`;
- both contain the exact 512-viewBox path.

The 2px absolute Y difference is the previously registered 48px Browser
fallback header versus 46px Native/Electron hidden-titlebar boundary. The row
and icon internal geometry is exact.

## Native evidence

- Production bundle:
  `60191f4bac2bd94892962c3a82c59344fe2c11c04d2129a081a07bb995d99dca`.
- Snapshot online backup:
  `12a8a33f8eefe75ea415f444ea8c5161b72c56785fc1bcd112e51565f0aa62ca`.
- Owned launch root/child: `29691 -> 29696`.
- PID-derived DevTool target: `localhost:8901/session 1`.
- Session URL points to the exact staged Synara bundle.
- Icon `15,187,15x15`.
- DOM parent is the button whose accessibility label is `Pull requests`.
- SVG contains the exact 512-viewBox path and light ink `#0d0d0d`.
- Warning/error console: empty.

The first Native capture command used an unquoted class containing brackets;
zsh rejected the glob before the helper ran. No invalid evidence was written.
The final capture uses the stable unique icon class.

Focused tests pass 2/2, the Sidebar regression suite passes 4/4, and
Lynx-for-Web plus Native/Desktop production builds pass with only existing
warnings.
