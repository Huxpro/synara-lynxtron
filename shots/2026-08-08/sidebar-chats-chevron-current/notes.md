# Sidebar Chats disclosure chevron

Status: retained Browser closed-state geometry and exact-owned Native real-touch
closed/open evidence.

## Residual

Web uses the shared `DisclosureChevron` primitive:

- generated Tabler `chevron-right`;
- 14x14;
- 4px gap after the label;
- 220ms ease-out rotation to 90 degrees;
- muted 79% paint.

Lynx used a text `›` glyph. Its box was `5.71875x16`, with different baseline,
shape, and paint behavior despite carrying the shared motion class.

## Implementation

The Lynx Chats adapter now uses existing generated icons:

- closed: `ChevronRightIcon`;
- open: `ChevronDownIcon`;
- fixed 14x14 slot;
- 4px gap;
- muted paint at 79% opacity;
- no Unicode glyph.

The two icon states share the same Tabler family and paint source. No icon asset
was copied or redrawn.

## Engine correction

The first implementation kept Web's rotation model. Real Native touch exposed
that Lynxtron 0.0.7 rotates SVG nodes around the top-left origin: the open
chevron moved from x=52 to x=38, a full 14px left jump into the label.

Two shared-origin corrections were tested and rejected with real Native
closed/open captures:

1. `transform-origin: center`;
2. `transform-origin: 50% 50%`.

Neither changed the Lynxtron result. Both were removed.

The final Native implementation swaps between same-family right/down SVGs in a
stable box instead of animating an unsupported center rotation. Web retains its
220ms rotating primitive. This is a narrow engine correction that preserves
state meaning and geometry rather than hiding the jump with a local translate.

## Browser evidence

At `1280x820`, DPR 1, light, comfortable, closed:

- Web button: `6,331.25,244x28`;
- Web chevron: `50.796875,338.25,14x14`, relative `44.796875,7`;
- Lynx button: `6,331.25,244x28`;
- Lynx chevron: `51.625,338.25,14x14`, relative `45.625,7`.

The sub-pixel X difference comes from cross-engine `Chats` text advance and is
below 1px. Both use the canonical `M9 6l6 6l-6 6` right-chevron path. Browser
page-error files are empty; Lynx transport remains connected.

## Native evidence

- Final production bundle:
  `bc15d22d8c11fbba6e2e92b406c61bf4b145a6b50fc76d9dcbaeb65cc0e64886`.
- Snapshot online backup:
  `c7e4af3478aa9d58945a096e07e2d3dd4f17df0a608b3568bc9638846f35d9b7`.
- Owned launch root/child: `97635 -> 97644`.
- PID-derived DevTool target: `localhost:8901/session 1`.
- Session URL points to the exact staged Synara bundle.
- Closed:
  - button `6,332,244x28`;
  - chevron `52,339,14x14`;
  - canonical right path;
  - body `244x4`.
- A real DevTool touch at the measured button center changed
  `aria-expanded` to `true`.
- Open:
  - button remains `6,332,244x28`;
  - chevron remains `52,339,14x14`;
  - canonical down path `M6 9l6 6l6 -6`;
  - body expands to 33px.
- Both warning/error consoles are empty.

Focused Sidebar + motion tests pass 6/6. Lynx-for-Web and Native/Desktop
production builds pass with only the existing encoder and optional `ws`
warnings.
