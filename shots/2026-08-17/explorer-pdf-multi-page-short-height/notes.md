# Explorer Multi-page PDF at 320x200

## Newly discovered scope

A real two-page PDF fixture was selected through a canonical project/thread in
the ordinary compact Explorer at `320x200`, dark. The preceding PDF slice used
one page only.

## P1 product loss

The single-page compact fallback hid Previous and Next unconditionally. With
the two-page fixture:

- page count correctly rendered `1 / 2`;
- Previous: `display:none`;
- Next: `display:none`;
- Open and the page image remained visible.

The fallback could render page one but offered no route to page two.

`lynx-explorer-pdf-compact-navigation-hidden`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

PDF fallback marks `pageCount > 1` with one multi-page modifier:

- single-page compact PDFs still hide ineffective navigation;
- multi-page compact PDFs restore 28px Previous/Next buttons;
- compact `‹` / `›` glyphs replace visible long labels while preserving the
  original accessibility labels;
- Open becomes a 28px compact glyph in the same toolbar;
- normal-size Previous/Next/Open labels remain unchanged.

## After evidence

Page one toolbar:

- Previous: `28x28 @ (164.5,122)`;
- page count: `44x14 @ (200.328125,129)`, `1 / 2`;
- Next: `28x28 @ (252.171875,122)`;
- Open: `28x28 @ (288,122)`;
- all four controls are disjoint and end at `x=316`.

A controlled shadow-DOM activation of the rendered Next control changed:

- page count `1 / 2 -> 2 / 2`;
- page URL `page=1 -> page=2`.

This proves the product handler and rendered page transition, but is not
claimed as trusted pointer evidence.

A temporary PNG was exactly `320x200`, SHA-256
`d513966fa2cec165dd3e53cc2e6e0bb5bdf65deafde39563d0868ec8de96912e`,
then deleted.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4554.2 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `3b1f809410bd510d59cf8a0c14385acc77803c4080a2c76bf71ec5c97ae7a7f0`.
- Native cannot certify `320x200`; the build is supporting evidence only.
- Every browser workflow used `bun run browser:run -- ...`; failed patch/test
  contract iterations were followed by the independent double-zero cleanup
  gate.
