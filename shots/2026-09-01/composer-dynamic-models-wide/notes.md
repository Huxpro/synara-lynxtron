# Composer dynamic-model picker wide parity

## Scope

- Surface: empty-landing Composer model picker, light `1280x820`.
- Web authority and Lynx-for-Web reused `/tmp/synara-model-picker-recapture`
  and backend `56949`, restarted only to switch the trusted origin.
- Both clients used real pointer interactions to open the model picker and
  browse OpenCode.
- The current live catalog contained six models: Big Pickle, Ling 3.0 Flash
  Fin Free, MiMo V2.5 Free, Muse Spark 1.2 Free, Nemotron 3 Ultra Free, and
  Nemotron 3.5 Lightning Free. The older seven-model evidence was not replayed
  as a fixture.

## Product loss and fix

Electron keeps the provider list visible in a right submenu while showing the
chosen provider's models at left. Native replaced the popup with one mobile-like
model page headed `Back to providers`.

Native now renders a `410px` wide two-pane browser at desktop widths:

- model catalog: `208px`;
- provider list: `192px`;
- the same provider/model projections and callbacks remain authoritative;
- compact and short-height viewports hide the provider pane and preserve the
  existing Back interaction.

Browsing a non-active provider no longer inserts or checks a remembered model
from the active provider. An init-query diagnostic exposed stale GPT-5 and was
rejected; the real pointer path showed only the six current OpenCode models.

## Native acceptance

- Exact-owned PID/window: `67346/27430`.
- Backend: `55760`.
- Bundle SHA-256:
  `50142f5bb8158a316ff02c29e834ac9e61193fa84bfd12b6edab70e43b02d2e9`.
- TraeX Computer Use used real New thread, model-trigger, and OpenCode clicks.
- Final Native state showed both panes, the same six models, no stale GPT-5
  entry, and retained GPT-5.5 as the actual Composer selection.

## Verification

- Focused model coverage: 3 files / 13 tests.
- ReactLynx best-practices scan: zero issues.
- Full Lynx/Desktop production build: passed with registered warnings only.
- Browser and comparison-process cleanup gates: clean.
