# Explorer Image at 320x200

## Newly discovered scope

A real `32x24` PNG fixture was selected through a canonical project/thread in
the ordinary compact Explorer at `320x200`, dark. Existing image evidence
covered normal-size Explorer only.

## P1 product loss

Before the fix:

- preview: `159.5x80`;
- outer selected-file header: 40px;
- content: `159.5x40`;
- image frame: `151.5x32`;
- image: `151.5x8`;
- repeated filename footer: 14px plus a 10px frame gap.

The aspect-fit surface technically mounted but only exposed an 8px-high strip.

`lynx-explorer-image-compact-preview-collapsed`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Image selection now adds a preview modifier. Only at short height:

- the redundant path and image filename hide;
- More actions becomes a 28px overlay;
- preview content takes the full 80px with 2px padding;
- image-frame gap is removed.

Normal-size image identity and layout remain unchanged.

## After evidence

- preview: `159.5x80 @ (160.5,120)`;
- More actions: `28x28 @ (288,124)`;
- content: `159.5x80`;
- image frame: `155.5x76 @ (162.5,122)`;
- image: `155.5x76`, bottom `198`;
- relay: one connection, zero pending requests, no transport/RPC error.

A temporary PNG was exactly `320x200`, SHA-256
`6150989f57c861153059812beca4de23fab812c3a5f72b0f2328eb45ee862697`,
then deleted.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4547.1 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `7ceabc77a447823459c61f907816217aa341933d361f654c551662a54c9523b1`.
- Native cannot certify `320x200`; the build is supporting evidence only.
- Every browser command ran through `bun run browser:run -- ...` and ended
  with zero sessions/processes.
