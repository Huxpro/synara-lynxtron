# Settings Appearance theme icons

Status: retained same-service Browser parity and exact-owned Native evidence
for the Appearance theme segmented-control icons.

## Residual

Web renders the Light, Dark, and System icons with a 16px visual box, 0.8
opacity, and `-mx-0.5`. The negative horizontal margin preserves a 14px layout
slot, so the button and label positions do not grow.

Lynx used a 14px visual box at full opacity. Its button geometry happened to
match Web, but the visible glyphs were smaller and stronger.

## Fix

- Generated Sun, Moon, and DeviceLaptop icons now render at 16px.
- The shared Appearance theme icon class applies `margin-left/right: -1px`.
- Icon opacity is 0.8.

This reproduces Web's visual-box/layout-slot split instead of merely enlarging
the icons and shifting the labels.

## Browser

The paired clients used the same isolated service at
`ws://127.0.0.1:58155`, trusted origin `http://localhost:8998`, Appearance
route, dark theme, comfortable density, and `1280x820` DPR 1.

Final Web/Lynx-for-Web geometry is exact:

- Light button `833.703125,167,71.296875x28`, icon
  `843.703125,173,16x16`;
- Dark button `909,167,69.09375x28`, icon `919,173,16x16`;
- System button `982.09375,167,84.90625x28`, icon
  `992.09375,173,16x16`;
- all icon opacity values are `0.8`;
- all label boxes remained unchanged.

The final Lynx-for-Web frame is `lynx-web.png` at `1280x820`. Connection
diagnostics remained empty.

## Native

- Production bundle:
  `541268e47e8ad922349313a44ad298d3d2173f9fad597ac65b8f2c6f0debe24d`;
- read-only SQLite online-backup:
  `7456ab4af646cf878d4a9f8af0a94975e6283d02d19ca936e3c4c8e7410c41d0`;
- owned launch root/child: `78666 -> 78672`;
- PID-derived DevTool target: `localhost:8902/session 1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.

A real DevTool touch hit the measured Appearance navigation button at
`128,232` (`nodeId 181`) before capture. The final three Native icon boxes are
16x16 at y=173 with opacity 0.8; `theme-icons.json` retains their node IDs,
SVG content, boxes, and computed paint. The Appearance root is present,
`TransportStatusRetry` count is zero, and the warning/error console is empty.
The raw Native frame is `2560x1640` at DPR 2.

The owned app and `/tmp` state were removed after capture. Existing
`.p10-view*` state was read only and left untouched.

## Verification

- Focused Appearance Rstest: 1 file, 3 tests passed.
- Lynx-for-Web production build passed.
- Native/Desktop production builds passed, including the isolated-service
  evidence build, with only existing encoder and optional `ws` warnings.
- Uncached changed-lines React Doctor against `8885a142` reported zero
  diagnostics.

## Remaining

The existing 1px downstream Appearance vertical drift was unchanged by this
fix, so it is not attributed to the icon anatomy. Profile still has a separate
feature-level residual: Web exposes real Share and Edit dialogs while Lynx
still exposes the older Copy summary action. Neither residual is presented as
closed by this slice.
