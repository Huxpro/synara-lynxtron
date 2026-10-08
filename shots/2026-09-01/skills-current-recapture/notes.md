# Skills current matched recapture

## Scope and identity

- Route: `/plugins`, Skills tab.
- Theme and viewport: light, `1280x820`, DPR 1.
- Web authority: `http://localhost:5733/plugins`.
- Lynx-for-Web: `http://localhost:8080/?route=%2Fplugins`.
- Both browser renderers used the same `/tmp/synara-skills-recapture-state`
  snapshot and backend port `56939`; the backend was restarted only to switch
  its trusted renderer origin.
- The Skills tab was activated through a real rendered click in each client.
- Browser ownership gates passed before, after failures, and at exit.

## Product result

The old 2026-08-14 Skills screenshot showed the obsolete gray puzzle rows.
Current source already replaced that anatomy, but this matched run exposed two
remaining current differences: Native constrained all content to `860px` while
Electron's grid uses the full body width, and Native's fixed accent palette did
not preserve Electron's name-derived hue families.

The Native page now uses Electron's effective wide composition:

- full-width grid with `20px` body gutters;
- `624px` centered search control;
- `40px` header;
- aligned hero, search, section-title, and row rhythm;
- fixed, Lynx-compatible colors ordered by the shared deterministic hue.

Equal-size temporary screenshots measured the following whole-frame RGB MAE:

- current pre-fix structure: `4.4923466643%`;
- after layout correction: `3.8928947722%`;
- after hue-family correction: `3.6364012932%`.

The screenshots were deleted after inspection rather than increasing the
already-over-budget local image count. Therefore this note records a verified
current comparison, but the old archive pair remains in the generated rolling
window until a retained evidence rotation replaces it.

## Native acceptance

The comparison harness was repaired to preserve the Lynxtron framework bundle's
relative symlinks with `ditto`, sign the embedded framework before the outer
app, and keep owned children in the foreground process group so terminal
interrupts reach Electron, Native, and their descendants.

The resulting exact-owned production instance used:

- PID/window: `38315/27152`;
- backend: `64628`;
- route: `/plugins`;
- light `1280x820`;
- staged bundle SHA-256:
  `cdc22845bed7bec1664b7389c471c9b1a84eb49ace16d67de1a35aef3caf90e2`.

TraeX Computer Use performed a real click on Skills, then dismissed the provider
update prompt. The final visible Native state contained the full two-column
skill grid, 624px search control, aligned wide layout, enabled checks, and the
corrected hue families. Host logs confirmed `provider.listSkills` against the
same backend and contained no `error`, `warn`, `exception`, or `fatal` entry.

## Verification

- Shared provider-discovery tests: `7/7`.
- Native Plugin Library tests: `3/3`.
- Comparison launcher tests: `19/19`.
- Fidelity-loss logic tests: `19/19`.
- ReactLynx best-practices scan: zero issues.
- Full Lynx/Desktop production build: passed with registered CSS and optional
  WebSocket accelerator warnings only.
- `git diff --check`: passed.
