# Settings Appearance theme-pack rhythm

Status: retained Browser root-cause closure and exact-owned Native support for
the Appearance theme-pack context line height.

## Residual

The Settings header, first Appearance card, section gaps, and every theme-pack
editor row height already matched Web. The first downstream drift appeared at
the theme-pack group:

- Web: two `475.5px` packs, `12px` gap, `963px` aggregate;
- Lynx: two `475px` packs, `12px` gap, `962px` aggregate.

That made the following UI-density card and every later row start 1px early.

The first mismatching child in each pack was the context copy:

- Web: 11px font, 16.5px line-height, 12px bottom padding, 28.5px box;
- Lynx: 11px font, 16px line-height, 12px bottom padding, 28px box.

Each pack lost 0.5px; two packs accumulated the observed 1px drift.

## Fix

`.SharedThemePackContext` now uses the Web-exact `line-height: 16.5px`.
No downstream offset, fixed pack height, margin, or compensating padding was
added.

## Browser

The paired clients used the same isolated service at
`ws://127.0.0.1:58155`, trusted origin `http://localhost:8998`, Appearance
route, dark theme, comfortable density, and `1280x820` DPR 1.

After rebuild and reload:

- contexts: `28.5px` each with resolved `16.5px` line-height;
- packs: `475.5px` each;
- theme-pack group: `963px`;
- second pack starts at `y=784.5`;
- UI density title returned from `y=1277` to the Web-exact `y=1278`;
- connection diagnostics remained empty.

The final Lynx-for-Web frame is `lynx-web.png` at `1280x820`.

## Native

- Production bundle:
  `aeb2d225f96084bedb4f435dadcc288b623a7f2f7c6f275ca55754fc928217f8`;
- owned launch root/child: `90994 -> 91000`;
- PID-derived DevTool target: `localhost:8902/session 1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.

A real DevTool touch hit the measured Appearance navigation button at
`128,232` before capture. Native computed styles preserve
`font-size: 11px` and `line-height: 16.5px` for both context nodes.
`TransportStatusRetry` count is zero and the warning/error console is empty.

Native DevTool quantizes the returned box model to whole logical pixels: it
reports each context as 29px and each pack as 476px rather than exposing the
Browser engine's half-pixel boxes. The exact 16.5px computed style is retained
in `rhythm.json`; half-pixel Native geometry is not claimed.

The raw Native frame is `2560x1640` at DPR 2. The owned app and `/tmp` state
were removed after capture; existing `.p10-view*` state remained untouched.

## Verification

- Focused ThemePack Rstest: 1 file, 5 tests passed.
- Lynx-for-Web production build passed.
- Native/Desktop production builds passed, including the isolated-service
  evidence build, with only existing encoder and optional `ws` warnings.
- Uncached changed-lines React Doctor against `fd596435` reported zero
  diagnostics.
