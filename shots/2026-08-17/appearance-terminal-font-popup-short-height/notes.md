# Appearance Terminal Font Popup at 320x200

## Newly closed interaction gap

The terminal-font input was brought into view programmatically only for setup,
then clicked through the real browser accessibility ref
`Default (JetBrains Mono)`.

This mounted the actual controlled
`SharedSettingsAppearanceFontPopup`; no DOM focus or synthetic component state
was used.

## P1 product loss

Before:

- input: `246x28 @ (37,86)`;
- popup: `224x334 @ (59,0)`, ending at `334`;
- list: `210x320 @ (66,7)`;
- list: `clientHeight=320`, `scrollHeight=352`.

The popup extended `134px` below the `200px` viewport.

`lynx-appearance-terminal-font-short-overflow`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

At short height only:

- popup height/max-height:
  `calc(100vh - 16px)`;
- suggestion list:
  flexes into the remaining height;
- list owns vertical scrolling.

## After evidence

- popup: `224x184 @ (59,16)`, ending exactly at `200`;
- popup client height: `182`;
- list: `210x170 @ (66,23)`, ending at `193`;
- list: `clientHeight=170`, `scrollHeight=352`;
- scroll range: `182px`.

## Validation

- Settings Appearance Rstest: `3/3` passed.
- Lynx-for-Web production build passed: `4581.1 kB`.
- Web bundle SHA-256:
  `acad0f63731bdf38c3e1ac75090abddbb3dfc8dd163398cfcc3a2c026938a793`.
- Native/Desktop production build passed: `4286.8 kB`.
- Staged Native bundle SHA-256:
  `69ca92749f01b565d3116fbdb8fa0c02627a82296b526e9fd4a509a03a1828c9`.
- One initial role lookup used the aria label while the browser tree exposed the
  placeholder as the accessible name; it failed before popup evidence and was
  followed by the double-zero gate.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  removed state, and repository screenshot count `100`.
