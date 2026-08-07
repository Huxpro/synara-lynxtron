# Short-window shell evidence

- Date: 2026-08-07
- Runtime: current Lynx-for-Web production bundle under a same-origin isolated
  Synara harness.
- Viewport width: `900`; device pixel ratio: `1`.
- Theme/density: light / comfortable.

## Existing ownership

At `900x480` the existing shell already behaves correctly:

- fixed sidebar: `256x480`;
- sidebar list scroll viewport: `255x390`;
- fixed Settings footer: `255x44`, `y=436..480`;
- landing body: `644x434`;
- centered heading + Composer stack: `644x244`, `y=141..385`;
- Composer: `620x133`, fully inside the body.

At `900x280` the sidebar list becomes independently scrollable while its footer
remains fixed. The landing stack still fits, so no responsive rule is needed at
that height.

## Real failure

At `900x200` the landing body is only `154px` high while the heading + Composer
stack is `244px`. The old flex centering placed the stack at `y=17.5..228.5`,
clipping both the heading and Composer with no vertical scroll owner.

## Fix

`ThreadsLandingBody` is now the sole vertical `scroll-view` for the landing
surface. `ThreadsLandingBodyInner` has `min-height:100%` and centers the stack
when it fits.

Measured after:

- at `900x200`, body `scrollHeight=244`, `clientHeight=154`, maximum
  `scrollTop=90`;
- at the top, the heading is fully visible at `y=46..157`;
- at the bottom, the Composer is fully visible at `y=67..200`;
- at `900x480`, body `scrollHeight=clientHeight=434`, so the stack remains
  centered and no scrollbar is introduced.

Artifacts:

- `height-200-top.json`;
- `height-200-bottom.json`, `height-200-bottom.png`;
- `height-480.json`, `height-480.png`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.

PNG dimensions match the requested viewports. Page errors are empty. Console
output contains only host setup logs and the registered upstream
`@lynx-js/web-core` deprecated-initialization warning.

## Verification

- focused landing Composer Rstest: `2/2`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- React Doctor reported two pre-existing `router.tsx` findings at lines 154
  and 250; neither points to the new landing scroll owner.

The named browser session, `58123/9002` harness, staged `/lynx` assets, and
temporary isolated home were removed after capture.
