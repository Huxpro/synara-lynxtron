# Explorer PDF at 320x200

## Newly discovered scope

A one-page PDF fixture under `/tmp/synara-explorer-pdf-workspace` was exposed
through a canonical project/thread and selected in the ordinary compact
Explorer at `320x200`, dark.

The fixture was a real PDF file and the server returned one page through
`projects.inspectPdf`. No SQLite fixture or fake preview state was used.

## P1 product loss

Before the fix, PDF fallback nested a second 44px toolbar below the 40px
selected-file header. In the 80px compact preview:

- preview: `159.5x80`;
- preview content: `159.5x40`, `scrollWidth=254`;
- PDF toolbar: `151.5x44`, bottom `208`;
- PDF controls: `233.625px` wide, ending at `x=414.125`;
- Open action: `x=361.1875..414.125`;
- page frame: `y=208..232`, entirely below the viewport;
- page image: no visible height.

The rendered fallback lost both its preview and its safe system-open action.

`lynx-explorer-pdf-compact-toolbar-overflow`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

PDF selection now adds one modifier to the existing preview. Only in
short-height ordinary Thread Explorer:

- the redundant outer filename is hidden;
- More actions becomes a 28px overlay;
- PDF content takes the full 80px preview;
- PDF toolbar is 32px;
- duplicate PDF identity and disabled single-page Previous/Next controls hide;
- page count and Open remain;
- page-frame padding drops to 2px.

Normal-size PDF controls and multi-page navigation remain unchanged.

## After evidence

- preview: `159.5x80 @ (160.5,120)`;
- More actions overlay: `28x28 @ (288,152)`;
- PDF content: `159.5x80`;
- toolbar: `159.5x33`, no horizontal overflow;
- page count: `44x14 @ (164.5,129)`;
- Open: `52.9375x28 @ (231.0625,122)`, ending at `x=284`;
- page frame: `159.5x47 @ (160.5,153)`;
- page image: `155.5x43 @ (162.5,155)`, bottom `198`;
- relay: one connection, zero pending requests, no transport/RPC error.

A temporary PNG was exactly `320x200`, SHA-256
`53f71e22cf8b7c20ade32f8041eea997f64c20b40d684fe1105db01f8595c043`,
then deleted.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4545.2 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `d752402706236f84de6d0953061f760fb6a7bbfcdf6203864a8202f254fca665`.
- Native cannot certify `320x200`; the build is supporting bundle evidence.
- The Open action was not activated because it would launch an external
  application. Reachability and exact bounds are proven; host delivery is not
  claimed in this cell.
- Every browser command ran through `bun run browser:run -- ...` and ended with
  zero sessions/processes.
