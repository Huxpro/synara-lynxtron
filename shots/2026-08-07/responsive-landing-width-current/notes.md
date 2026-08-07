# Responsive landing heading evidence

- Date: 2026-08-07
- Runtime: current Lynx-for-Web production bundle served in an isolated named
  browser session.
- Theme/density: light / comfortable.
- Height: `480`; device pixel ratio: `1`.

## Residual

The Lynx landing heading had fixed widths:

- ordinary heading: `321px`;
- project-specific heading: `400px`.

At a 600px window the fixed 256px sidebar leaves a 344px main column. After the
landing frame's 24px inline padding, neither fixed width is a safe compact
contract; the 400px project heading necessarily escapes the main column.

The Web authority does not set a fixed heading width. It uses the parent inline
padding and allows text to wrap.

## Fix

Compact Lynx windows now set every `CenteredEmptyLandingHeading` to
`calc(100% - 48px)`. Wide windows retain the existing calibrated 321px ordinary
and 400px project widths.

Measured geometry:

- `600x480`: main column `344px`; heading `248px`, `x=304..552`, no horizontal
  overflow;
- `1024x480`: main column `768px`; ordinary heading returns to `321px`.

The retained runtime snapshot contains the ordinary heading. The focused
contract also locks the project-specific class under the same compact override;
no fabricated project state was introduced for this slice.

Artifacts:

- `compact-600.json`, `compact-600.png`;
- `wide-1024.json`, `wide-1024.png`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.

PNG dimensions match the requested viewports. Page errors are empty. Console
output contains only host setup logs and the registered upstream
`@lynx-js/web-core` deprecated-initialization warning.

## Verification

- empty landing + landing Composer focused Rstest: `5/5`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- React Doctor changed scope: `100/100`, zero diagnostics.
