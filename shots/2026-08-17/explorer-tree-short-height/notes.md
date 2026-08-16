# Explorer Tree at 320x200

## Newly discovered scope

A canonical temporary workspace contained:

- `src/one.ts`;
- `src/nested/two.ts`;
- `src/nested/deeper/three.ts`;
- `root.txt`.

The ordinary compact Explorer started with `src` and `src/nested` expanded at
`320x200`, dark.

## Evidence

- entries owner: `158.5x43 @ (1,157)`;
- `clientHeight=43`, `scrollHeight=174`;
- every tree row: `152.5x28`;
- root indentation: 8px;
- child indentation: 20px;
- grandchild indentation: 32px;
- row copy ends at `x=148.5`, inside the 159.5px sidebar;
- three canonical `projects.listDirectories` RPCs loaded root and both expanded
  directories;
- relay: one connection, zero pending requests, no transport/RPC error.

The compact tree preserves row rhythm, hierarchy, containment, and a real
vertical scroll owner. This is a product pass, contribution `0.00 -> 0.00`; no
code change was required.

## Boundaries

- The expanded state was deterministic harness initialization. It is not
  claimed as trusted pointer expansion evidence.
- Scroll range was measured, but no programmatic scroll was relabeled as wheel
  or gesture evidence.
- Native cannot certify `320x200`.
- Every browser workflow used `bun run browser:run -- ...` and ended with zero
  sessions/processes.
