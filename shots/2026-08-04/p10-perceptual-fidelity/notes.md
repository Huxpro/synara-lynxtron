# P10 perceptual fidelity evidence

Status: Phase 0 Browser baseline retained; Native and remaining canonical states pending

## Contract

`manifest.json` is the source of truth for P10 residual evidence. Strict mode
must remain red while a required client cell is missing or a P0/P1 residual is
open:

```bash
bun run --cwd apps/lynx evidence:perceptual
```

The offline comparison data is generated with:

```bash
bun run --cwd apps/lynx evidence:perceptual:write
```

The verifier checks:

- explicit semantic route, theme, density, viewport, and interaction state;
- required Web, Lynx-for-Web, and Native cells;
- real PNG dimensions for raw and normalized comparison frames;
- build and snapshot identity;
- geometry, resolved-style, and console artifacts;
- artifact client/state identity;
- state-echo equality;
- residual category, severity, owner, impact, recommendation, and disposition;
- evidence and reason for accepted noise or intentional platform deltas;
- zero open P0/P1 residuals in strict mode.

## Honest baseline

The initial six canonical states are intentionally pending. Historical P8/P9
captures may guide investigation but cannot satisfy P10 because they do not all
share the current build, snapshot, normalized comparison viewport, residual
schema, or style sampling contract.

The first retained batch will use one isolated server and one real snapshot for:

1. New Chat landing;
2. Sidebar;
3. Composer default;
4. Project Picker open;
5. filtered skill menu;
6. Settings General.

The first current-build Browser batch now retains landing, Sidebar, and
Composer. Its residuals produced shared root-cause fixes rather than local
negative margins:

- browser body inset reset;
- header rail correction;
- project section spacing/padding correction;
- project-label line box/gap correction;
- removal of the misleading project thread count.

The exact measurements and discarded harness attempts are recorded in
`apps/lynx/plan/reports/p10-perceptual-baseline.md`.

Native remains diagnostic because DevTool released the exact-owned endpoint
before route/geometry revalidation completed. Strict mode therefore remains
red.
