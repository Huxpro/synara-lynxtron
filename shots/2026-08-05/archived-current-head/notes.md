# Current-head Archived fidelity proof

## Harness

- Date: 2026-08-05
- Viewport: `1280x820`, DPR 1, light theme
- Same trusted `localhost:8921` origin and isolated server snapshot
- Snapshot SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`
- Final Lynx-for-Web bundle SHA-256:
  `9c8bd30ec4806611ae90991c639fa2826d44a047391aba1a4adf45b6cdb8cb25`
- Final Native/Desktop bundle SHA-256:
  `db62eba7fe3fc09ad16ebc6f2febe742163d07a5469a6f9e6760b81f3b59a80e`

The real snapshot has no archived threads, so this proof covers the empty
state. It does not claim visual coverage for populated restore rows; their
canonical command path and content-driven row contract remain focused-test
evidence.

## Residual and repair

The empty surface matched Web in position, dimensions, padding, dashed border,
icon, and 14/20 copy, but its computed radius was `0px`. The CSS referenced
undefined `--radius-lg`, so Lynx dropped the entire declaration.

Archived empty/loading/error and restore-error surfaces now use the Web-owned
explicit 10px radius. Final empty-state geometry:

- root: `x=456 y=118 w=624 h=182`;
- padding: `40px 20px`;
- border: `1px dashed`;
- radius: `10px`;
- icon shell: `44x44`, radius 22;
- generated Archive icon: `20x20`;
- title: `14/20/500`;
- description: `14/20/400`.

## Evidence

- `archived-web-1280x820-light.png`: current Web authority.
- `archived-lynx-web-1280x820-light.png`: Lynx before radius repair.
- `archived-lynx-web-1280x820-light-final.png`: final current bundle.
- All PNGs are exactly `1280x820`; both browser sessions had no page errors.

## Gates

- Focused Archived suite: 1 file, 3/3 passed.
- Lynx-for-Web and Native/Desktop production builds passed.
- `bun fmt`, `bun lint`, and `bun typecheck` remain unauthorized.
