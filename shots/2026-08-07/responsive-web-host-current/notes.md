# Lynx-for-Web responsive host evidence

- Date: 2026-08-07
- Runtime: current production Lynx-for-Web bundle served directly from
  `apps/lynx/dist/web`.
- Bundle SHA-256:
  `89d600a7f350f46318839cd6a735696af19a6030f130b6a83eea3bcee0d771ea`
- Browser session: isolated named `agent-browser` session.
- Device pixel ratio: `1`.

## Before

Lynx-for-Web had no implementation for the shared `windowGetViewport` bridge
method and published no `viewport:resize` event. The shared
`useViewportLayout()` hook therefore stayed at
`SliceRoot--viewport-unknown`, even at a measured `640x820` browser viewport.
This prevented every user-space compact/medium layout rule from running in the
fast Web harness.

## After

The Web host now implements the same contract as Desktop:

- `windowGetViewport` returns `innerWidth` / `innerHeight`;
- browser `resize` publishes `viewport:resize(width, height)`;
- the resize listener is removed during `pagehide`.

One live browser session proved both hydration and update:

- `640x820` resolves `SliceRoot--viewport-compact` with numeric
  `data-viewport-width="640"` / `data-viewport-height="820"`;
- resizing the same page to `1024x820` resolves
  `SliceRoot--viewport-wide` and updates the numeric attributes to `1024x820`.

Artifacts:

- `compact.json`, `compact-640x820.png`;
- `wide.json`, `wide-1024x820.png`;
- `errors.txt`, `console.txt`.

PNG dimensions exactly match the requested logical viewports. Page errors are
empty. Console output contains only Lynxtron Web setup logs and the previously
registered upstream `@lynx-js/web-core` deprecated-initialization warning.

Focused `ResponsiveLayout.lynx.test.ts` passed `2/2`; the Lynx-for-Web
production build passed.
